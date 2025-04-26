import { NextRequest, NextResponse } from 'next/server';
import { connectToMasterDb } from '@/lib/masterdb';

// API route for fetching question categories for filters
export async function GET(request: NextRequest) {
  try {
    // Connect to the master database
    const db = await connectToMasterDb();
    
    // If grade filter is provided, filter subcategories accordingly
    const { searchParams } = new URL(request.url);
    const gradeFilter = searchParams.get('grade');
    
    // Build category filters - omit empty values
    const filter: Record<string, unknown> = {};
    if (gradeFilter && gradeFilter.trim() !== '') {
      filter.grade = parseInt(gradeFilter, 10);
    }
    
    // Fetch all necessary data in parallel for better performance
    const [grades, cat1Values] = await Promise.all([
      db.collection('categories').distinct('grade'),
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