import JSZip from "jszip";

export async function POST(req: Request) {
  try {

    const body = await req.json();

    const photos = body.photos as string[];

    const zip = new JSZip();

    for (let i = 0; i < photos.length; i++) {

      const imageUrl = photos[i];

      const response = await fetch(imageUrl);

      if (!response.ok) {
        continue;
      }

      const arrayBuffer =
        await response.arrayBuffer();

      zip.file(
        `photo-${i + 1}.jpg`,
        arrayBuffer
      );
    }

    const zipContent =
      await zip.generateAsync({
        type: "arraybuffer",
      });

    return new Response(zipContent, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition":
          'attachment; filename="presentation-day-photos.zip"',
      },
    });

  } catch (error) {

    console.error(error);

    return new Response(
      JSON.stringify({
        error: "Failed to create zip",
      }),
      {
        status: 500,
      }
    );
  }
}