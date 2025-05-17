import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';


// API route for fetching question categories for filters
export async function GET(request: NextRequest) {
  try {
    // Connect to the master database
    const domain = request.headers.get("x-domain") || "localhost:3000";
    const db = await connectToDatabase(domain);
    
    // If grade filter is provided, filter subcategories accordingly
    const { searchParams } = new URL(request.url);
    const gradeFilter = searchParams.get('grade');
    const username = searchParams.get('username');
    
    // Build category filters - omit empty values
    const filter: Record<string, unknown> = {};
    if (gradeFilter && gradeFilter.trim() !== '') {
      filter.grade = parseInt(gradeFilter, 10);
    }
    
    // Filter by username if provided
    if (username && username.trim() !== '') {
      filter.createdBy = username;
    }
    
    // Fetch all necessary data in parallel for better performance
    const [grades, cat1Values] = await Promise.all([
      db.collection('categories').distinct('grade', username && username.trim() !== '' ? { createdBy: username } : {}),
      db.collection('categories').distinct('cat1', filter)
    ]);
    
    // Get cat2-cat4 values if both grade and cat1 are provided
    let cat2Values: string[] = [];
    let cat3Values: string[] = [];
    let cat4Values: string[] = [];
    
    const cat1Filter = searchParams.get('cat1');
    if (gradeFilter && gradeFilter.trim() !== '' && cat1Filter && cat1Filter.trim() !== '') {
      const combinedFilter = { ...filter, cat1: cat1Filter };
      
      const cat2Filter = searchParams.get('cat2');
      if (cat2Filter && cat2Filter.trim() !== '') {
        const cat3Filter = { ...combinedFilter, cat2: cat2Filter };
        
        const cat3FilterValue = searchParams.get('cat3');
        if (cat3FilterValue && cat3FilterValue.trim() !== '') {
          const cat4Filter = { ...cat3Filter, cat3: cat3FilterValue };
          
          // Fetch dependent categories in parallel for better performance
          [cat2Values, cat3Values, cat4Values] = await Promise.all([
            db.collection('categories').distinct('cat2', combinedFilter),
            db.collection('categories').distinct('cat3', cat3Filter),
            db.collection('categories').distinct('cat4', cat4Filter)
          ]);
        } else {
          // Fetch just cat2 and cat3 if cat3 is not selected
          [cat2Values, cat3Values] = await Promise.all([
            db.collection('categories').distinct('cat2', combinedFilter),
            db.collection('categories').distinct('cat3', cat3Filter)
          ]);
        }
      } else {
        // Only fetch cat2 if cat2 is not selected
        cat2Values = await db.collection('categories').distinct('cat2', combinedFilter);
      }
    }
    
    // Filter out empty values and sort results for better UX
    return NextResponse.json({
      categories: {
        grades: grades.sort((a: number, b: number) => a - b),
        cat1: cat1Values.filter((val: string) => val && val.trim() !== '').sort(),
        cat2: cat2Values.filter((val: string) => val && val.trim() !== '').sort(),
        cat3: cat3Values.filter((val: string) => val && val.trim() !== '').sort(),
        cat4: cat4Values.filter((val: string) => val && val.trim() !== '').sort()
      }
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// Define an interface for category document
interface CategoryDocument {
  grade: number;
  cat1: string;
  cat2: string;
  cat3: string;
  cat4: string;
  schoolCode?: string;
  createdBy?: string;
  createdAt?: Date;
}

// API route for adding new categories
export async function POST(request: NextRequest) {
  try {
    // Connect to the master database
    const domain = request.headers.get("x-domain") || "localhost:3000";
    const db = await connectToDatabase(domain);
    
    // Get category data from request
    const categoryData = await request.json();
    
    // Validate required fields
    if (!categoryData.grade || typeof categoryData.grade !== 'number') {
      return NextResponse.json(
        { error: 'Grade is required and must be a number' },
        { status: 400 }
      );
    }
    
    if (!categoryData.cat1 || typeof categoryData.cat1 !== 'string' || !categoryData.cat1.trim()) {
      return NextResponse.json(
        { error: 'Category 1 (subject) is required' },
        { status: 400 }
      );
    }
    
    // Check if this exact category combination already exists
    const filter: CategoryDocument = {
      grade: categoryData.grade,
      cat1: categoryData.cat1,
      cat2: categoryData.cat2 || '',
      cat3: categoryData.cat3 || '',
      cat4: categoryData.cat4 || '',
    };
    
    const existingCategory = await db.collection('categories').findOne(filter);
    
    // If category already exists, just return success
    if (existingCategory) {
      return NextResponse.json({ success: true, message: 'Category already exists' });
    }
    
    // Add schoolCode if available
    if (categoryData.schoolCode) {
      filter.schoolCode = categoryData.schoolCode;
    }
    
    // Add createdBy if available
    if (categoryData.createdBy) {
      filter.createdBy = categoryData.createdBy;
    }
    
    // Add timestamp
    filter.createdAt = new Date();
    
    // Insert the new category
    const result = await db.collection('categories').insertOne(filter);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Category added successfully',
      id: result.insertedId 
    });
  } catch (error) {
    console.error('Error adding category:', error);
    return NextResponse.json(
      { error: 'Failed to add category' },
      { status: 500 }
    );
  }
} 