import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { image, prompt } = await req.json();

    if (!image || !prompt) {
      return NextResponse.json(
        { error: 'Missing image or prompt in the request payload.' },
        { status: 400 }
      );
    }

    if (!process.env.DEEPINFRA_API_KEY) {
      console.error('[Generate] DEEPINFRA_API_KEY is not set');
      return NextResponse.json(
        { error: 'Server configuration error.' },
        { status: 500 }
      );
    }

    // =============================================
    // FLUX-2-klein-9b on DeepInfra's native inference endpoint supports
    // multimodal image inputs via FOUR specific parameters:
    //   input_image_1, input_image_2, input_image_3, input_image_4
    // These accept a full "data:image/jpeg;base64,..." Data URL string.
    // (Not 'image', not 'init_image' — those are silently ignored.)
    //
    // Docs confirmed at: deepinfra.com/black-forest-labs/FLUX-2-klein-9b/api
    // =============================================

    console.log('[Generate] Image prefix:', image?.slice(0, 60));
    console.log('[Generate] Prompt (80 chars):', prompt?.slice(0, 80));

    const requestPayload = {
      prompt:         prompt,
      input_image_1:  image,  // full "data:image/jpeg;base64,..." Data URL
      width:          1024,
      height:         1024,
      output_format:  'jpeg',
    };

    const response = await fetch(
      'https://api.deepinfra.com/v1/inference/black-forest-labs/FLUX-2-klein-9b',
      {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          Authorization:   `Bearer ${process.env.DEEPINFRA_API_KEY}`,
        },
        body: JSON.stringify(requestPayload),
      }
    );

    const data = await response.json();
    console.log('[Generate] Response keys:', Object.keys(data));

    if (!response.ok) {
      console.error('[Generate] DeepInfra error:', JSON.stringify(data));
      return NextResponse.json(
        { error: data.error?.message || data.detail || 'DeepInfra request failed.' },
        { status: response.status }
      );
    }

    // Log raw structure so we can confirm the correct key
    console.log('[Generate] images length:', data.images?.length, '| output length:', data.output?.length);

    const rawImage = data.images?.[0] ?? data.output?.[0] ?? null;

    if (!rawImage) {
      console.error('[Generate] Unexpected response:', JSON.stringify(data).slice(0, 300));
      return NextResponse.json(
        { error: 'No image returned. Check server logs.' },
        { status: 500 }
      );
    }

    // Normalise: add data URI prefix if the model returns raw base64
    let resultUrl = rawImage as string;
    if (!resultUrl.startsWith('data:') && !resultUrl.startsWith('http')) {
      resultUrl = `data:image/jpeg;base64,${resultUrl}`;
    }

    return NextResponse.json({ imageUrl: resultUrl });
  } catch (error) {
    console.error('[Generate] Server error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
