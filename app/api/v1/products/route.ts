import { mockProducts20 } from "@/Data/mockProducts";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('category')
    
    const queryData = query ? mockProducts20.filter((product) => product.gender.includes(query)) : mockProducts20
    console.log(queryData, 'hekko');
    
    
    return Response.json(queryData)
}