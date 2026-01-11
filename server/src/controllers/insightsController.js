import Transaction from '../models/transactionModel.js';
import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';
import https from 'https';

const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const startOfNextMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1);

const monthLabel = (d) => d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });

const sumBy = (items, predicate) => items.reduce((acc, item) => acc + (predicate(item) || 0), 0);

const mean = (arr) => {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
};

const stdDev = (arr) => {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((acc, v) => acc + (v - m) * (v - m), 0) / (arr.length - 1);
  return Math.sqrt(variance);
};

const httpsJson = (url, { method = 'GET', headers = {}, body } = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(url);

      const req = https.request(
        {
          protocol: u.protocol,
          hostname: u.hostname,
          path: `${u.pathname}${u.search}`,
          method,
          headers
        },
        (res) => {
          let raw = '';
          res.on('data', (chunk) => {
            raw += chunk;
          });
          res.on('end', () => {
            let data = {};
            try {
              data = raw ? JSON.parse(raw) : {};
            } catch (e) {
              data = {};
            }

            const status = res.statusCode || 0;
            resolve({
              ok: status >= 200 && status < 300,
              status,
              data
            });
          });
        }
      );

      req.on('error', (err) => reject(err));
      if (body) req.write(body);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
};

const tryOpenAIReply = async ({ message, context }) => {
  const apiKey = (process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) {
    return { reply: null, error: 'OPENAI_API_KEY not set' };
  }

  const system = [
    'You are a helpful personal finance assistant for a budgeting app.',
    'Be concise and actionable.',
    'If the user asks for something impossible without more data, ask a clarifying question.',
    '',
    'User financial context (this month):',
    context
  ].join('\n');

  const modelsToTry = [
    (process.env.OPENAI_MODEL || '').trim(),
    'gpt-4o-mini',
    'gpt-4o',
    'gpt-3.5-turbo'
  ].filter(Boolean);

  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const response = await httpsJson('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: message }
          ],
          temperature: 0.3,
          max_tokens: 256
        })
      });

      const data = response.data || {};
      if (!response.ok) {
        const msg = data?.error?.message || `OpenAI request failed (HTTP ${response.status})`;
        lastError = `${model}: ${msg}`;
        continue;
      }

      const text = String(data?.choices?.[0]?.message?.content || '').trim();
      if (!text) {
        lastError = `${model}: OpenAI returned empty response`;
        continue;
      }

      return { reply: text, error: null };
    } catch (e) {
      lastError = e?.message || 'OpenAI request failed';
    }
  }

  return { reply: null, error: lastError || 'OpenAI request failed' };
};

const tryGeminiReply = async ({ message, context }) => {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    return { reply: null, error: 'GEMINI_API_KEY not set' };
  }

  const prompt = [
    'You are a helpful personal finance assistant for a budgeting app.',
    'Be concise and actionable.',
    'If the user asks for something impossible without more data, ask a clarifying question.',
    '',
    'User financial context (this month):',
    context,
    '',
    'User question:',
    message
  ].join('\n');

  const attempts = [
    // Newer endpoint (works for many accounts / keys)
    { apiVersion: 'v1', model: 'gemini-1.5-flash' },
    { apiVersion: 'v1', model: 'gemini-1.5-flash-latest' },

    { apiVersion: 'v1', model: 'gemini-1.5-pro' },
    { apiVersion: 'v1', model: 'gemini-1.5-pro-latest' },

    // Older Generative Language API defaults
    { apiVersion: 'v1beta', model: 'gemini-pro' },
    { apiVersion: 'v1beta', model: 'gemini-1.0-pro' },
  ];

  const normalizeModelId = (name) => {
    if (!name) return null;
    return String(name).replace(/^models\//, '');
  };

  const listModels = async (apiVersion) => {
    const url = `https://generativelanguage.googleapis.com/${apiVersion}/models?key=${encodeURIComponent(apiKey)}`;
    const response = await httpsJson(url);
    if (!response.ok) {
      const msg = response?.data?.error?.message || `ListModels failed (HTTP ${response.status})`;
      throw new Error(`${apiVersion}: ${msg}`);
    }
    const models = Array.isArray(response?.data?.models) ? response.data.models : [];
    return models
      .map((m) => ({
        name: normalizeModelId(m?.name),
        supported: Array.isArray(m?.supportedGenerationMethods) ? m.supportedGenerationMethods : []
      }))
      .filter((m) => m.name);
  };

  const pickBestModel = (models) => {
    const candidates = models.filter((m) => m.supported.includes('generateContent'));
    if (!candidates.length) return null;

    const preference = [
      'gemini-2.0-flash',
      'gemini-2.0-pro',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro'
    ];

    const score = (name) => {
      const idx = preference.findIndex((p) => name.includes(p));
      return idx === -1 ? 999 : idx;
    };

    return candidates.sort((a, b) => score(a.name) - score(b.name))[0];
  };

  let lastError = null;

  for (const attempt of attempts) {
    try {
      const { apiVersion, model } = attempt;
      const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const response = await httpsJson(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 256
          }
        })
      });

      const data = response.data || {};

      if (!response.ok) {
        const msg = data?.error?.message || `Gemini request failed (HTTP ${response.status})`;
        lastError = `${apiVersion}/${model}: ${msg}`;
        continue;
      }

      const text = (data?.candidates?.[0]?.content?.parts || [])
        .map((p) => p?.text)
        .filter(Boolean)
        .join('')
        .trim();

      if (!text) {
        lastError = `${apiVersion}/${model}: Gemini returned empty response`;
        continue;
      }

      return { reply: text, error: null };
    } catch (e) {
      lastError = e?.message || 'Gemini request failed';
    }
  }

  // If none of the common model names worked, discover models available for this key.
  try {
    const [v1Models, v1betaModels] = await Promise.allSettled([listModels('v1'), listModels('v1beta')]);

    const discovered = [
      ...(v1Models.status === 'fulfilled' ? v1Models.value : []),
      ...(v1betaModels.status === 'fulfilled' ? v1betaModels.value : [])
    ];

    const best = pickBestModel(discovered);
    if (best?.name) {
      // Try again with the discovered best model on both endpoints.
      const versionsToTry = ['v1', 'v1beta'];
      for (const apiVersion of versionsToTry) {
        try {
          const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${encodeURIComponent(best.name)}:generateContent?key=${encodeURIComponent(apiKey)}`;

          const response = await httpsJson(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: prompt }]
                }
              ],
              generationConfig: { temperature: 0.3, maxOutputTokens: 256 }
            })
          });

          const data = response.data || {};
          if (!response.ok) {
            const msg = data?.error?.message || `Gemini request failed (HTTP ${response.status})`;
            lastError = `discovered ${apiVersion}/${best.name}: ${msg}`;
            continue;
          }

          const text = (data?.candidates?.[0]?.content?.parts || [])
            .map((p) => p?.text)
            .filter(Boolean)
            .join('')
            .trim();

          if (text) {
            return { reply: text, error: null };
          }

          lastError = `discovered ${apiVersion}/${best.name}: Gemini returned empty response`;
        } catch (e) {
          lastError = `discovered ${apiVersion}/${best.name}: ${e?.message || 'Gemini request failed'}`;
        }
      }
    } else {
      lastError = lastError || 'No generateContent-capable Gemini model found for this API key (ListModels)';
    }
  } catch (e) {
    lastError = lastError || e?.message || 'ListModels failed';
  }

  return { reply: null, error: lastError || 'Gemini request failed' };
};

const buildInsights = ({ currentIncome, currentExpenses, prevIncome, prevExpenses, categorySpend, prevAvgCategorySpend, anomalies }) => {
  const insights = [];

  const balance = currentIncome - currentExpenses;
  const savingsRate = currentIncome > 0 ? balance / currentIncome : 0;
  const prevBalance = prevIncome - prevExpenses;
  const prevSavingsRate = prevIncome > 0 ? prevBalance / prevIncome : 0;

  const savingsRateChange = savingsRate - prevSavingsRate;

  if (savingsRate >= 0.3) {
    insights.push({
      id: 'savings-success',
      type: 'success',
      title: 'Strong Savings Rate',
      description: `Your savings rate is ${(savingsRate * 100).toFixed(0)}% this month. Keep up the great work!`,
      action: 'View Summary'
    });
  } else if (savingsRate > 0 && savingsRate < 0.2) {
    insights.push({
      id: 'savings-warning',
      type: 'warning',
      title: 'Low Savings Rate',
      description: `Your savings rate is ${(savingsRate * 100).toFixed(0)}%. Consider reducing discretionary spending.`,
      action: 'Find Savings'
    });
  }

  if (Math.abs(savingsRateChange) >= 0.05) {
    insights.push({
      id: 'savings-change',
      type: savingsRateChange > 0 ? 'success' : 'warning',
      title: savingsRateChange > 0 ? 'Savings Improved' : 'Savings Dropped',
      description: `Your savings rate changed by ${(Math.abs(savingsRateChange) * 100).toFixed(0)}% vs last month.`,
      action: 'Compare Months'
    });
  }

  Object.entries(categorySpend)
    .sort((a, b) => (b[1] || 0) - (a[1] || 0))
    .slice(0, 3)
    .forEach(([cat, amount], idx) => {
      const prevAvg = prevAvgCategorySpend[cat] || 0;
      if (prevAvg > 0 && amount > prevAvg * 1.25) {
        insights.push({
          id: `overspend-${cat}`,
          type: 'warning',
          title: `Overspending in ${cat}`,
          description: `You spent ₹${Math.round(amount).toLocaleString('en-IN')} on ${cat}, which is higher than your recent average of ₹${Math.round(prevAvg).toLocaleString('en-IN')}.`,
          action: 'Review'
        });
      } else if (idx === 0) {
        insights.push({
          id: `topcat-${cat}`,
          type: 'tip',
          title: `Top Expense Category: ${cat}`,
          description: `Your highest spending category this month is ${cat}. Consider setting a soft limit for next month.`,
          action: 'Set Budget'
        });
      }
    });

  if (anomalies.length) {
    insights.push({
      id: 'anomaly',
      type: 'warning',
      title: 'Unusual Spending Detected',
      description: `We found ${anomalies.length} unusually large expense(s) compared to your recent history.`,
      action: 'Review'
    });
  }

  if (!insights.length) {
    insights.push({
      id: 'default',
      type: 'info',
      title: 'No Major Alerts',
      description: 'Your spending looks consistent with your recent patterns.',
      action: 'View Details'
    });
  }

  return insights.slice(0, 6);
};

export const getInsights = asyncHandler(async (req, res, next) => {
  const now = new Date();
  const start = startOfMonth(now);
  const end = startOfNextMonth(now);

  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevStart = startOfMonth(prev);
  const prevEnd = startOfNextMonth(prev);

  const [currentTx, prevTx, last90] = await Promise.all([
    Transaction.find({ user: req.user.id, date: { $gte: start, $lt: end } }).sort({ date: -1 }),
    Transaction.find({ user: req.user.id, date: { $gte: prevStart, $lt: prevEnd } }),
    Transaction.find({
      user: req.user.id,
      type: 'expense',
      date: { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), $lt: end }
    })
  ]);

  const currentIncome = sumBy(currentTx, (t) => (t.type === 'income' ? Number(t.amount) : 0));
  const currentExpenses = sumBy(currentTx, (t) => (t.type === 'expense' ? Number(t.amount) : 0));

  const prevIncome = sumBy(prevTx, (t) => (t.type === 'income' ? Number(t.amount) : 0));
  const prevExpenses = sumBy(prevTx, (t) => (t.type === 'expense' ? Number(t.amount) : 0));

  const balance = currentIncome - currentExpenses;
  const savingsRate = currentIncome > 0 ? balance / currentIncome : 0;

  const prevBalance = prevIncome - prevExpenses;
  const prevSavingsRate = prevIncome > 0 ? prevBalance / prevIncome : 0;
  const savingsRateChange = savingsRate - prevSavingsRate;

  const categorySpend = {};
  currentTx.forEach((t) => {
    if (t.type !== 'expense') return;
    const cat = String(t.category || 'other');
    categorySpend[cat] = (categorySpend[cat] || 0) + Number(t.amount);
  });

  const prev3Start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const prev3Expenses = await Transaction.find({
    user: req.user.id,
    type: 'expense',
    date: { $gte: prev3Start, $lt: start }
  });

  const prevByMonthCategory = {};
  prev3Expenses.forEach((t) => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const cat = String(t.category || 'other');
    if (!prevByMonthCategory[key]) prevByMonthCategory[key] = {};
    prevByMonthCategory[key][cat] = (prevByMonthCategory[key][cat] || 0) + Number(t.amount);
  });

  const prevAvgCategorySpend = {};
  const monthKeys = Object.keys(prevByMonthCategory);
  monthKeys.forEach((mk) => {
    const cats = prevByMonthCategory[mk];
    Object.entries(cats).forEach(([cat, amt]) => {
      if (!prevAvgCategorySpend[cat]) prevAvgCategorySpend[cat] = [];
      prevAvgCategorySpend[cat].push(Number(amt));
    });
  });

  const prevAvgCategorySpendFinal = {};
  Object.entries(prevAvgCategorySpend).forEach(([cat, arr]) => {
    prevAvgCategorySpendFinal[cat] = mean(arr);
  });

  const histAmountsByCategory = {};
  last90.forEach((t) => {
    const cat = String(t.category || 'other');
    if (!histAmountsByCategory[cat]) histAmountsByCategory[cat] = [];
    histAmountsByCategory[cat].push(Number(t.amount));
  });

  const anomalies = currentTx
    .filter((t) => t.type === 'expense')
    .map((t) => {
      const cat = String(t.category || 'other');
      const hist = histAmountsByCategory[cat] || [];
      const m = mean(hist);
      const sd = stdDev(hist);
      const amt = Number(t.amount);
      const threshold = sd > 0 ? m + 2 * sd : m * 1.75;
      const isAnomaly = hist.length >= 5 && amt > threshold && amt > 0;

      if (!isAnomaly) return null;
      return {
        id: String(t._id),
        category: cat,
        amount: amt,
        date: new Date(t.date).toISOString(),
        description: t.description || ''
      };
    })
    .filter(Boolean);

  const totalCategories = Object.keys(categorySpend).length;
  const onBudget = Object.entries(categorySpend).filter(([cat, amt]) => {
    const prevAvg = prevAvgCategorySpendFinal[cat];
    if (!prevAvg || prevAvg <= 0) return true;
    return Number(amt) <= prevAvg * 1.1;
  }).length;

  const title = savingsRate >= 0.25 ? "You're doing great this month!" : "Here's your monthly snapshot";
  const messageParts = [];

  messageParts.push(`Your savings rate is ${(savingsRate * 100).toFixed(0)}%`);
  if (Math.abs(savingsRateChange) >= 0.01) {
    messageParts.push(`${savingsRateChange > 0 ? 'up' : 'down'} ${(Math.abs(savingsRateChange) * 100).toFixed(0)}% vs last month`);
  }

  if (totalCategories > 0) {
    messageParts.push(`You've stayed within your usual range for ${onBudget} out of ${totalCategories} categories`);
  }

  const summary = {
    month: monthLabel(now),
    income: currentIncome,
    expenses: currentExpenses,
    balance,
    savingsRate,
    savingsRateChange,
    onBudget,
    totalCategories,
    title,
    message: messageParts.join('. ') + '.'
  };

  const previousSummary = {
    month: monthLabel(prev),
    income: prevIncome,
    expenses: prevExpenses,
    balance: prevBalance,
    savingsRate: prevSavingsRate
  };

  const insights = buildInsights({
    currentIncome,
    currentExpenses,
    prevIncome,
    prevExpenses,
    categorySpend,
    prevAvgCategorySpend: prevAvgCategorySpendFinal,
    anomalies
  });

  res.status(200).json({
    success: true,
    data: {
      summary,
      previousSummary,
      insights,
      anomalies
    }
  });
});

export const chatInsights = asyncHandler(async (req, res, next) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return next(new ErrorResponse('Please provide a message', 400));
  }

  const now = new Date();
  const start = startOfMonth(now);
  const end = startOfNextMonth(now);
  const tx = await Transaction.find({ user: req.user.id, date: { $gte: start, $lt: end } });

  const income = sumBy(tx, (t) => (t.type === 'income' ? Number(t.amount) : 0));
  const expenses = sumBy(tx, (t) => (t.type === 'expense' ? Number(t.amount) : 0));
  const balance = income - expenses;

  const categorySpend = {};
  tx.forEach((t) => {
    if (t.type !== 'expense') return;
    const cat = String(t.category || 'other');
    categorySpend[cat] = (categorySpend[cat] || 0) + Number(t.amount);
  });

  const top = Object.entries(categorySpend).sort((a, b) => (b[1] || 0) - (a[1] || 0))[0];

  const geminiContext = [
    `Month: ${monthLabel(now)}`,
    `Income: ₹${Math.round(income).toLocaleString('en-IN')}`,
    `Expenses: ₹${Math.round(expenses).toLocaleString('en-IN')}`,
    `Balance: ₹${Math.round(balance).toLocaleString('en-IN')}`,
    top ? `Top expense category: ${top[0]} (₹${Math.round(top[1]).toLocaleString('en-IN')})` : 'Top expense category: (none)'
  ].join('\n');

  const { reply: openaiReply, error: openaiError } = await tryOpenAIReply({ message, context: geminiContext });
  if (openaiReply) {
    return res.status(200).json({
      success: true,
      data: { reply: openaiReply, provider: 'openai' }
    });
  }

  const normalizedOpenAIError = String(openaiError || '').toLowerCase();
  const isOpenAIQuotaOrRateLimit =
    normalizedOpenAIError.includes('quota') ||
    normalizedOpenAIError.includes('rate limit') ||
    normalizedOpenAIError.includes('insufficient_quota') ||
    normalizedOpenAIError.includes('billing') ||
    normalizedOpenAIError.includes('429');

  if (openaiError && isOpenAIQuotaOrRateLimit) {
    console.warn(`OpenAI blocked: ${openaiError}`);
    return res.status(200).json({
      success: true,
      data: {
        reply:
          'OpenAI API quota/rate limit exceeded (or billing not enabled) for your API key. Please check your OpenAI plan/usage and try again later.',
        provider: 'openai_error',
        _debug: { openaiError }
      }
    });
  }

  const { reply: geminiReply, error: geminiError } = await tryGeminiReply({ message, context: geminiContext });
  if (geminiReply) {
    return res.status(200).json({
      success: true,
      data: { reply: geminiReply, provider: 'gemini' }
    });
  }

  if (geminiError) {
    console.warn(`Gemini fallback: ${geminiError}`);
  }

  const normalizedGeminiError = String(geminiError || '').toLowerCase();
  const isQuotaOrRateLimit =
    normalizedGeminiError.includes('quota') ||
    normalizedGeminiError.includes('rate limit') ||
    normalizedGeminiError.includes('429');

  if (geminiError && isQuotaOrRateLimit) {
    return res.status(200).json({
      success: true,
      data: {
        reply:
          'Gemini API quota/rate limit exceeded for your API key. Please check billing/limits in Google AI Studio and try again later (or use a new API key).',
        provider: 'gemini_error',
        _debug: { geminiError }
      }
    });
  }

  const normalized = message.toLowerCase();
  let reply = '';

  if (normalized.includes('income') && normalized.includes('expense')) {
    reply = `For ${monthLabel(now)}, your income is ₹${Math.round(income).toLocaleString('en-IN')} and expenses are ₹${Math.round(expenses).toLocaleString('en-IN')}. Your balance is ₹${Math.round(balance).toLocaleString('en-IN')}.`;
  } else if (
    normalized.includes('expense') ||
    normalized.includes('spend') ||
    normalized.includes('spent')
  ) {
    const topText = top
      ? ` Your top expense category is ${top[0]} at ₹${Math.round(top[1]).toLocaleString('en-IN')}.`
      : '';
    reply = `For ${monthLabel(now)}, your total expenses are ₹${Math.round(expenses).toLocaleString('en-IN')}.${topText}`;
  } else if (normalized.includes('top') || normalized.includes('most') || normalized.includes('highest')) {
    if (top) {
      reply = `Your highest spending category this month is ${top[0]} at ₹${Math.round(top[1]).toLocaleString('en-IN')}.`;
    } else {
      reply = `I don't see any expenses for ${monthLabel(now)} yet. Add transactions to get insights.`;
    }
  } else if (normalized.includes('save') || normalized.includes('saving')) {
    const savingsRate = income > 0 ? balance / income : 0;
    reply = `Your savings rate this month is ${(savingsRate * 100).toFixed(0)}%. If you want to improve it, focus on reducing the top expense category and keeping recurring costs in check.`;
  } else if (normalized.includes('budget')) {
    reply = `A simple approach is to set a monthly spending limit for your top 1-2 categories and track weekly. If you want, tell me your target savings % and I can suggest a budget split.`;
  } else {
    reply = `Ask me things like: "What's my income vs expenses this month?", "How much did I spend this month?", "What is my top spending category?", or "How can I save more?"`;
  }

  res.status(200).json({
    success: true,
    data: {
      reply,
      provider: 'fallback',
      ...(geminiError ? { _debug: { geminiError } } : {})
    }
  });
});
