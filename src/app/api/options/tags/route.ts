import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'querystring';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const params = parse(url.search.substring(1));
    
    // Get search query parameter
    const query = params.query as string || '';
    
    // Example data - in a real app this would come from a database
    const allTags = [
      { label: "پایه دهم", value: "دهم" },
      { label: "پایه یازدهم", value: "یازدهم" },
      { label: "پایه دوازدهم", value: "دوازدهم" },
      { label: "ریاضی", value: "ریاضی" },
      { label: "تجربی", value: "تجربی" },
      { label: "انسانی", value: "انسانی" },
      { label: "هنر", value: "هنر" },
      { label: "کلاس A", value: "کلاس A" },
      { label: "کلاس B", value: "کلاس B" },
      { label: "کلاس C", value: "کلاس C" },
      { label: "صبح", value: "صبح" },
      { label: "عصر", value: "عصر" },
      { label: "زبان انگلیسی", value: "زبان انگلیسی" },
      { label: "زبان عربی", value: "زبان عربی" },
      { label: "فیزیک", value: "فیزیک" },
      { label: "شیمی", value: "شیمی" },
      { label: "زیست", value: "زیست" },
      { label: "جغرافیا", value: "جغرافیا" },
      { label: "تاریخ", value: "تاریخ" },
      { label: "ادبیات", value: "ادبیات" },
    ];
    
    // Filter tags based on search query
    let filteredTags = allTags;
    if (query) {
      const searchLower = query.toLowerCase();
      filteredTags = allTags.filter(tag => 
        tag.label.toLowerCase().includes(searchLower) || 
        tag.value.toLowerCase().includes(searchLower)
      );
    }
    
    // Add short delay to simulate network request
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return NextResponse.json({ options: filteredTags });
  } catch (error) {
    console.error("Error fetching tag options:", error);
    return NextResponse.json(
      { error: "Failed to fetch tag options" },
      { status: 500 }
    );
  }
} 