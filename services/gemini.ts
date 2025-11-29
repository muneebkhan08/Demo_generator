/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Using gemini-3-pro-preview for high reasoning and visual analysis capabilities.
const GEMINI_MODEL = 'gemini-3-pro-preview';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are an expert Frontend Engineer, Product Designer, and Motion Graphics Artist.
Your goal is to generate a comprehensive, self-contained **HTML5 Desktop Screencast Player** (Loom-style).

*** DEEP ANALYSIS & CONTEXT ***
1. **Website Analysis**: You will be provided a Target URL and potentially reference images.
   - If the URL is well-known (e.g., Linear, Stripe, Airbnb), use your internal knowledge to replicate its exact current aesthetic (fonts, colors, layout density).
   - If images are provided, use them as the primary source of truth for the visual design.
   - If the URL is generic or unknown, infer the industry style from the domain name and generate a high-fidelity, premium SaaS design.
2. **User Flow**: Follow the user's specific "Instruction/Flow" script.
   - If they say "Show login then dashboard", you must animate the transition.
   - If they say "Hover over the chart", you must animate the cursor and the chart tooltip.

*** CORE OUTPUT REQUIREMENTS ***
1. **Single HTML File**: Return ONLY raw HTML with embedded CSS (<style>) and JavaScript (<script>).
2. **Desktop Browser Simulation**:
   - The main container must be a 16:9 aspect ratio "Screen".
   - **Browser Window**: A high-fidelity mock "Chrome" or "Arc" browser window.
     - Must have a realistic header (address bar with the provided URL, traffic light buttons).
     - **Content Area**: This is where the website lives.
     - **CRITICAL**: If images are provided, you should generally embed the first one as the main hero/body if it looks like a full screenshot. If multiple images are provided, you can cycle through them or place them in the layout. 
     - If NO images are provided, you must **HALLUCINATE** a high-fidelity, pixel-perfect replica of the website described using Tailwind CSS. It should NOT look like a wireframe.
3. **Loom-Style Presenter Overlay**:
   - Add a circular "Camera Bubble" in the bottom-left or bottom-right corner.
   - Use a professional avatar image.
   - Add a "Mic" icon or audio wave animation to simulate talking.
4. **Animation Layer**:
   - **Cursor**: A realistic macOS mouse cursor (SVG) that moves smoothly over the content.
   - **Interactions**: Hover states (buttons glow), Clicks (ripple effects), and **Scrolling** (the content must scroll down).
   - **Captions**: A floating "Subtitle" pill at the bottom center displaying the voiceover text.

*** AUDIO IMPLEMENTATION (CRITICAL) ***
- You MUST use the **Web Speech API (\`window.speechSynthesis\`)** to actually speak the captions.
- In your JavaScript timeline, when a caption appears, immediately trigger \`speechSynthesis.speak()\` with the corresponding text.
- Attempt to select a high-quality voice (e.g., "Google US English", "Samantha", or a generic female/male voice).
- Ensure the reading rate is natural (approx rate: 1.0 or 0.9).

*** ANIMATION & CONTENT LOGIC ***
- **JavaScript Animation Engine**:
  - Create a robust timeline of events (async/await or setTimeouts).
  - Example events:
    1. Cursor moves to "Sign Up".
    2. Caption shows: "First, let's navigate to the registration page." -> **Speak this text**.
    3. Click interaction.
    4. Browser content scrolls down to show features.
- **Scroll Behavior**: The "website" inside the browser frame should be taller than the frame. The animation should scroll this container to reveal more content.
- **Replayability**: Wrap the animation in a function (e.g., \`playDemo()\`) that starts automatically but can be called again.

*** CODE STRUCTURE ***
- Use **Tailwind CSS** (CDN) for all styling.
- Use **Vanilla JS** for the logic.
- **Image Handling**: If the user provides base64 images, inject them directly into the HTML as valid <img> sources.
- **Video Controls**: A simple timeline/progress bar at the bottom of the screen.

*** VISUAL STYLE ***
- **Platform**: Desktop Web (MacOS style window).
- **Aesthetic**: Premium, Clean, Professional.
- **Colors**: Auto-detect based on the URL or images.

RETURN ONLY THE RAW HTML CODE STARTING WITH <!DOCTYPE html>.
`;

interface ImageAttachment {
  base64: string;
  mimeType: string;
}

export async function bringToLife(
  url: string, 
  instructions: string, 
  images: ImageAttachment[] = []
): Promise<string> {
  const parts: any[] = [];
  
  const finalPrompt = `
  *** DESKTOP SCREENCAST GENERATION REQUEST ***
  
  TARGET URL: "${url}"
  USER INSTRUCTIONS/FLOW: "${instructions}"
  ATTACHED REFERENCE IMAGES: ${images.length}
  
  TASK:
  1. ANALYZE the URL and any attached images to determine the brand, color palette, and layout.
  2. GENERATE a high-fidelity HTML/CSS/JS simulation of this website inside a browser frame.
  3. ANIMATE the cursor and scroll behavior to match the "User Instructions".
  4. IF IMAGES are provided, incorporate them intelligently (e.g., as the main page content or as feature sections).
  5. ADD a Loom-style presenter bubble narrating the flow described.
  6. IMPLEMENT Web Speech API for real-time voice narration of the script.
  
  GENERATE THE FULL HTML/JS/CSS NOW.
  `;

  parts.push({ text: finalPrompt });

  // Add all images to the request
  images.forEach(img => {
    parts.push({
      inlineData: {
        data: img.base64,
        mimeType: img.mimeType,
      },
    });
  });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: {
        parts: parts
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7, 
      },
    });

    let text = response.text || "<!-- Failed to generate content -->";
    // Clean up markdown code blocks if present
    text = text.replace(/^```html\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');

    return text;
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
}