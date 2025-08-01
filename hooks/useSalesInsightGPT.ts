import { format } from 'date-fns';
import { OpenAI } from 'openai';
import { useEffect, useState } from 'react';
import { formatPrice } from '~/lib/utils';
import { Transaction } from '~/types';

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

type HourlySummary = Record<string, { revenue: number; orders: number }>;

function summarizeHourly(transactions: Transaction[]): HourlySummary {
  const summary: HourlySummary = {};

  for (const t of transactions) {
    const hour = format(new Date(t.createdAt.toDate()), 'h a');
    if (!summary[hour]) {
      summary[hour] = { revenue: 0, orders: 0 };
    }
    summary[hour].revenue += t.amount;
    summary[hour].orders += 1;
  }

  return summary;
}

export function useSalesInsightGPT({
  transactionsToday,
  transactionsLastWeek,
}: {
  transactionsToday: Transaction[];
  transactionsLastWeek: Transaction[];
}) {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!transactionsToday?.length && !transactionsLastWeek?.length) return;

    const todayHourly = summarizeHourly(transactionsToday || []);
    const lastWeekHourly = summarizeHourly(transactionsLastWeek || []);

    const hours = Array.from(
      new Set([...Object.keys(todayHourly), ...Object.keys(lastWeekHourly)]),
    ).sort();

    const hourlyComparison = hours
      .map((hour) => {
        const today = todayHourly[hour] || { revenue: 0, orders: 0 };
        const lastWeek = lastWeekHourly[hour] || { revenue: 0, orders: 0 };

        return `🕒 ${hour}
  - Today: ${formatPrice(today.revenue)} from ${today.orders} orders with an average order value of ${formatPrice(
    today.revenue / today.orders,
  )}
  - Last Week: ${formatPrice(lastWeek.revenue)} from ${lastWeek.orders} orders with an average order value of ${formatPrice(
    lastWeek.revenue / lastWeek.orders,
  )}`;
      })
      .join('\n\n');

    const prompt = `
Compare the sales performance hour-by-hour between today and the same day last week.

Use emojis to indicate performance:
- 🔥 or 📈 if today is better than last week
- 😢 or 📉 if today is worse
- ➖ if they are about the same

Here's the breakdown:

${hourlyComparison}

Now provide a short summary of trends you observe, and highlight key improvements or declines using emojis.`.trim();

    (async () => {
      setLoading(true);
      try {
        const res = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful and concise sales analyst.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        });

        setInsight(res.choices[0].message.content || '');
      } catch (err) {
        console.error('GPT Insight Error:', err);
        setInsight('Error generating insight.');
      } finally {
        setLoading(false);
      }
    })();
  }, [transactionsToday, transactionsLastWeek]);

  return { insight, loading };
}
