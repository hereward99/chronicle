import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, contentType } = await req.json();
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompts: Record<string, string> = {
      scene: `You are a creative writer for Vampire: The Masquerade 5th Edition tabletop roleplaying game. Generate atmospheric, immersive scene descriptions based on the user's prompt. Include sensory details, mood, tension, and Gothic horror elements appropriate for the World of Darkness setting. Write in present tense. Keep it to 2-3 paragraphs.`,
      
      npc: `You are a character designer for Vampire: The Masquerade 5th Edition tabletop roleplaying game. Create detailed NPCs based on the user's prompt. Include:
- Name and title
- Clan and Generation
- Physical description
- Personality traits
- Goals and motivations
- A memorable quote
Format with markdown headers and bullet points for readability.`,
      
      story: `You are a story writer for Vampire: The Masquerade 5th Edition tabletop roleplaying game. Create compelling story hooks and plot seeds based on the user's prompt. Include:
- A catchy title
- The hook/premise
- 2-3 complications or twists
- Potential revelations or outcomes
Make it suitable for a Storyteller to use in their chronicle. Format with markdown.`,
      
      location: `You are a location designer for Vampire: The Masquerade 5th Edition tabletop roleplaying game. Create detailed locations based on the user's prompt. Include:
- Name and type (haven, Elysium, feeding ground, etc.)
- Atmospheric description
- Key features and areas
- Security measures
- Notable NPCs who frequent it
Format with markdown headers and bullet points.`
    };

    const systemPrompt = systemPrompts[contentType] || systemPrompts.scene;

    console.log("Generating content type:", contentType, "with prompt:", prompt);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate content" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content generated");
    }

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-content:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
