import { NextResponse } from "next/server";

// Constants for OpenAI API
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1";

export const runtime = 'nodejs';

interface ExamStatistics {
  examName: string;
  examCode: string;
  totalParticipants: number;
  finishedCount: number;
  averageScore: number;
  maxScore: number;
  highestScore: number;
  lowestScore: number;
  questionAnalysis: Array<{
    questionNum: number;
    category: string;
    topic?: string; // cat1 - specific topic/concept
    correctPercentage: number;
    wrongPercentage: number;
    unansweredPercentage: number;
    difficultyRate: number;
    correctCount: number;
    wrongCount: number;
    unansweredCount: number;
  }>;
  categoryPerformance: Array<{
    category: string;
    performanceRate: number;
    correctCount: number;
    wrongCount: number;
    unansweredCount: number;
  }>;
  scanAnalysis?: {
    totalScanned: number;
    totalNotScanned: number;
    avgRightAnswers: number;
    avgWrongAnswers: number;
    avgMultipleAnswers: number;
    avgUnanswered: number;
  };
  scoreDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const body = await request.json() as { statistics: ExamStatistics };
    const { statistics } = body;

    if (!statistics) {
      return NextResponse.json(
        { error: "Statistics data is required" },
        { status: 400 }
      );
    }

    // Create a comprehensive prompt for GPT
    const prompt = `شما یک تحلیلگر آموزشی حرفه‌ای هستید. لطفاً آمار زیر از یک آزمون را به دقت تحلیل کنید و یک گزارش جامع و کاربردی به زبان فارسی ارائه دهید.

📊 اطلاعات آزمون:
- نام آزمون: ${statistics.examName}
- کد آزمون: ${statistics.examCode}
- تعداد شرکت‌کنندگان: ${statistics.totalParticipants}
- تعداد تکمیل شده: ${statistics.finishedCount}
- میانگین نمره: ${statistics.averageScore} از ${statistics.maxScore}
- بالاترین نمره: ${statistics.highestScore}
- پایین‌ترین نمره: ${statistics.lowestScore}

📈 توزیع نمرات:
${statistics.scoreDistribution.map(d => `- ${d.range}: ${d.count} نفر (${d.percentage}%)`).join('\n')}

📚 عملکرد دسته‌بندی‌ها:
${statistics.categoryPerformance.map(c => `- ${c.category}: ${c.performanceRate}% موفقیت (صحیح: ${c.correctCount}, اشتباه: ${c.wrongCount}, بدون پاسخ: ${c.unansweredCount})`).join('\n')}

❓ تحلیل سوالات (فقط سوالات با مشکل):
${statistics.questionAnalysis
  .filter(q => q.difficultyRate > 50 || q.unansweredPercentage > 30)
  .slice(0, 15)
  .map(q => `- سوال ${q.questionNum} - موضوع: ${q.topic || q.category} (دسته: ${q.category}): صحیح ${q.correctPercentage}%, اشتباه ${q.wrongPercentage}%, بدون پاسخ ${q.unansweredPercentage}% - ضریب سختی: ${q.difficultyRate}%`)
  .join('\n')}

🎯 تحلیل موضوعی (Topics):
${(() => {
  // Group questions by topic
  const topicStats: Record<string, {
    total: number;
    correctCount: number;
    wrongCount: number;
    unansweredCount: number;
  }> = {};

  statistics.questionAnalysis.forEach(q => {
    const topic = q.topic || q.category;
    if (!topicStats[topic]) {
      topicStats[topic] = { total: 0, correctCount: 0, wrongCount: 0, unansweredCount: 0 };
    }
    topicStats[topic].total++;
    topicStats[topic].correctCount += q.correctCount;
    topicStats[topic].wrongCount += q.wrongCount;
    topicStats[topic].unansweredCount += q.unansweredCount;
  });

  return Object.entries(topicStats)
    .map(([topic, stats]) => {
      const totalAttempts = stats.correctCount + stats.wrongCount;
      const successRate = totalAttempts > 0 
        ? Math.round((stats.correctCount / (stats.correctCount + stats.wrongCount + stats.unansweredCount)) * 100)
        : 0;
      return `- ${topic}: ${successRate}% موفقیت (صحیح: ${stats.correctCount}, اشتباه: ${stats.wrongCount}, بدون پاسخ: ${stats.unansweredCount})`;
    })
    .join('\n');
})()}

${statistics.scanAnalysis ? `
🔍 آمار اسکن:
- تعداد اسکن شده: ${statistics.scanAnalysis.totalScanned}
- میانگین پاسخ صحیح در اسکن: ${statistics.scanAnalysis.avgRightAnswers}
- میانگین پاسخ اشتباه: ${statistics.scanAnalysis.avgWrongAnswers}
- میانگین چند گزینه‌ای: ${statistics.scanAnalysis.avgMultipleAnswers}
- میانگین بدون پاسخ: ${statistics.scanAnalysis.avgUnanswered}
` : ''}

لطفاً یک گزارش تحلیلی جامع شامل موارد زیر به زبان فارسی ارائه دهید:

1. **خلاصه کلی عملکرد**: ارزیابی کلی از نتایج آزمون
2. **نقاط قوت**: چه چیزی خوب بوده است؟
3. **نقاط ضعف**: چه مشکلاتی وجود دارد؟
4. **تحلیل موضوعی (Topics/cat1)**: کدام موضوعات/مفاهیم نیاز به تمرین بیشتر دارند؟ کدام موضوعات به خوبی فهمیده شده‌اند؟ لطفاً موضوعاتی که دانش‌آموزان در آن‌ها ضعیف هستند را به وضوح مشخص کنید و اولویت‌بندی کنید.
5. **تحلیل سوالات**: کدام سوالات مشکل دارند و چرا؟
6. **توصیه‌ها برای معلم**: چه کارهایی باید انجام شود؟ کدام موضوعات باید دوباره تدریس شوند؟
7. **پیشنهادات برای بهبود**: چگونه می‌توان نتایج را بهبود بخشید؟

گزارش باید:
- کاملاً به زبان فارسی باشد
- ساده، واضح و قابل فهم باشد
- شامل نکات عملی و کاربردی باشد
- از ایموجی مناسب استفاده کند
- از قالب‌بندی Markdown استفاده کند
- حداکثر 1000 کلمه باشد`;

    // Call OpenAI API
    const openaiResponse = await fetch(`${OPENAI_API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "شما یک تحلیلگر آموزشی حرفه‌ای هستید که به معلمان کمک می‌کنید تا نتایج آزمون‌ها را بهتر درک کنند و تصمیمات آموزشی بهتری بگیرند. همیشه به زبان فارسی و با لحنی دوستانه و حرفه‌ای پاسخ دهید."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error("OpenAI API Error:", errorData);
      return NextResponse.json(
        { error: "Failed to generate AI analysis" },
        { status: 500 }
      );
    }

    const data = await openaiResponse.json();
    const aiResponse = data.choices[0]?.message?.content || "";

    return NextResponse.json({
      analysis: aiResponse,
      usage: data.usage,
    });
  } catch (error) {
    console.error("Error in AI analysis:", error);
    return NextResponse.json(
      { error: "Failed to generate AI analysis" },
      { status: 500 }
    );
  }
}

