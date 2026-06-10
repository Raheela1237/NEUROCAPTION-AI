import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Your Gemini API Key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Creative fallback generator based on image context
function generateCreativeFallback(mode, language, category, platform, sceneInfo = null) {
    const emojis = ['✨', '🌟', '💫', '⭐', '⚡', '🔥', '💪', '🎯', '💕', '🌸', '🌙', '☀️'];
    const randomEmoji = () => emojis[Math.floor(Math.random() * emojis.length)];
    
    const templates = {
        normal: {
            English: [
                `${randomEmoji()} Living in the moment, creating memories that last forever...`,
                `${randomEmoji()} Sometimes you just have to enjoy the little things ✨`,
                `${randomEmoji()} This view hits different today 🌟`,
                `${randomEmoji()} Just another beautiful day in paradise 💫`,
                `${randomEmoji()} Making moments matter, one step at a time ⭐`
            ],
            Urdu: [
                `${randomEmoji()} لمحات کو جینا سیکھو، یہی اصل خوبصورتی ہے`,
                `${randomEmoji()} چھوٹی چھوٹی خوشیاں ہی زندگی ہیں`,
                `${randomEmoji()} یہ لمحہ صرف تمہارے لیے ہے ✨`,
                `${randomEmoji()} خوبصورت دن کی خوبصورت شروعات 🌸`,
                `${randomEmoji()} مسکراہٹوں بھرا دن مبارک ہو 💕`
            ],
            Sindhi: [
                `${randomEmoji()} لمحن کي جيئڻ سکو، هي ئي اصل خوبصورتي آهي`,
                `${randomEmoji()} ننڍيون ننڍيون خوشيون ئي زندگي آهن`,
                `${randomEmoji()} هي لمحو رڳو توهان لاءِ آهي ✨`,
                `${randomEmoji()} خوبصورت ڏينهن جي خوبصورت شروعات 🌸`,
                `${randomEmoji()} مرڪن سان ڀرپور ڏينهن مبارڪ هجي 💕`
            ]
        },
        romantic: {
            English: [
                `❤️ Lost in your eyes, found in your heart... ${randomEmoji()}`,
                `💕 Every love story is beautiful, but ours is my favorite`,
                `🌸 You make my world brighter just by being in it`,
                `💖 Forever isn't long enough when I'm with you`,
                `🌹 You had me at hello... and every moment after`
            ],
            Urdu: [
                `❤️ تمہاری آنکھوں میں کھویا، تمہارے دل میں پایا`,
                `💕 ہر محبت کی کہانی خوبصورت ہے، لیکن ہماری سب سے خاص`,
                `🌸 تم ہو تو دنیا حسین ہے`,
                `💖 تمہارے ساتھ لمحے بھی صدیاں لگتے ہیں`,
                `🌹 پہلی نظر میں ہی تم نے مجھے جیت لیا`
            ],
            Sindhi: [
                `❤️ تنهنجي اکين ۾ گم، تنهنجي دل ۾ لڌم`,
                `💕 هر محبت جي ڪهاڻي خوبصورت آهي، پر اسان جي سڀ کان خاص`,
                `🌸 تون آهين ته دنيا حسين آهي`,
                `💖 تنهنجي سنگ ۾ لمحا به صديون لڳن ٿا`,
                `🌹 پهرين نظر ۾ ئي تون مون کي جتيو`
            ]
        },
        motivational: {
            English: [
                `💪 Dream it. Believe it. Achieve it. ${randomEmoji()}`,
                `⭐ Success is not final, failure is not fatal: it is the courage to continue that counts`,
                `🚀 Your only limit is your mind. Break free and soar!`,
                `🌟 Every expert was once a beginner. Keep going!`,
                `⚡ Don't stop until you're proud. Your future self will thank you`
            ],
            Urdu: [
                `💪 سپنہ دیکھو، یقین کرو، حاصل کرو`,
                `⭐ کامیابی آخری نہیں، ناکامی مہلک نہیں، اہم ہے جاری رکھنے کی ہمت`,
                `🚀 تمہاری واحد حد تمہارا ذہن ہے۔ آزاد ہو جاؤ!`,
                `🌟 ہر ماہر کبھی beginner تھا۔ جاری رکھو!`,
                `⚡ اس وقت تک مت روکو جب تک فخر نہ ہو۔ تمہارا مستقبل تمہارا شکریہ ادا کرے گا`
            ],
            Sindhi: [
                `💪 خواب ڏسو، يقين ڪريو، حاصل ڪريو`,
                `⭐ ڪاميابي آخري ناهي، ناڪامي مهلڪ ناهي، اہم آهي جاري رکڻ جي همت`,
                `🚀 توهان جي واحد حد توهان جو ذهن آهي. آزاد ٿي وڃو!`,
                `🌟 هر ماهر ڪڏهن beginner هو. جاري رکو!`,
                `⚡ ان وقت تائين نه روڪيو جيستائين فخر نه ٿئي. توهان جو مستقبل توهان جي مهرباني ادا ڪندو`
            ]
        },
        funny: {
            English: [
                `😂 I'm not lazy, I'm just on energy saving mode`,
                `🤣 My life is a comedy and I'm the main character`,
                `😅 Adulting is hard, but someone's gotta do it... I guess?`,
                `🤪 My brain has two modes: 100% focus or 100%... wait, what was I saying?`,
                `🙃 I put the 'pro' in procrastination. Let me get back to you on that`
            ],
            Urdu: [
                `😂 میں کاہل نہیں، میں توانائی بچانے کے موڈ پر ہوں`,
                `🤣 میری زندگی ایک کامیڈی ہے اور میں مرکزی کردار ہوں`,
                `😅 بڑا ہونا مشکل ہے، لیکن کسی کو تو کرنا ہوگا...`,
                `🤪 میرے دماغ کے دو موڈ ہیں: 100% فوکس یا 100%... رکو، میں کیا کہہ رہا تھا؟`,
                `🙃 میں نے 'pro' لگایا ہے procrastination میں۔ میں بعد میں بتاؤں گا`
            ],
            Sindhi: [
                `😂 مان ڪاھل ناهيان، مان توانائي بچائڻ جي موڊ تي آهيان`,
                `🤣 منهنجي زندگي هڪ ڪاميڊي آهي ۽ مان مکيه ڪردار آهيان`,
                `😅 وڏو ٿيڻ مشڪل آهي، پر ڪنهن کي ته ڪرڻو پوندو...`,
                `🤪 منهنجي دماغ جا ٻه موڊ آهن: 100% فوڪس يا 100%... رکو، مان ڇا چئي رهيو هوس؟`,
                `🙃 مون 'pro' لڳايو آهي procrastination ۾. مان بعد ۾ ٻڌائيندس`
            ]
        },
        savage: {
            English: [
                `🔥 While you were sleeping, I was leveling up`,
                `💅 I'm not arguing, I'm just explaining why I'm right`,
                `👑 Know your worth, then add tax`,
                `😤 I'm not bossy, I just know what you should be doing`,
                `💯 I'm not perfect, but I'm always myself. That's more than most can say`
            ],
            Urdu: [
                `🔥 جب تم سو رہے تھے، میں ترقی کر رہا تھا`,
                `💅 میں بحث نہیں کر رہا، میں بتا رہا ہوں کیوں میں صحیح ہوں`,
                `👑 اپنی قیمت پہچانو، پھر ٹیکس لگاؤ`,
                `😤 میں ڈکٹیٹر نہیں، مجھے بس پتہ ہے تمہیں کیا کرنا چاہیے`,
                `💯 میں کامل نہیں، لیکن ہمیشہ خود ہوں۔ یہ زیادہ تر لوگوں سے زیادہ ہے`
            ],
            Sindhi: [
                `🔥 جڏهن توهان سمهي رهيا هئاسين، مان ترقي ڪري رهيو هوس`,
                `💅 مان بحث ناهي ڪري رهيو، مان ٻڌائي رهيو آهيان ڇو مان صحيح آهيان`,
                `👑 پنهنجي قيمت سڃاڻو، پوءِ ٽيڪس لڳايو`,
                `😤 مان ڊڪٽيٽر ناهيان، مون کي رڳو پتو آهي توهان کي ڇا ڪرڻ گهرجي`,
                `💯 مان مڪمل ناهيان، پر هميشه پاڻ آهيان. هي گهڻن ماڻهن کان وڌيڪ آهي`
            ]
        },
        emotional: {
            English: [
                `💔 Some feelings are too deep for words...`,
                `🌙 Late nights, deep thoughts, healing hearts`,
                `🕯️ Slowly learning that some things are not meant to be understood`,
                `💫 Sometimes you have to lose yourself to find yourself`,
                `🌊 Tears are words the heart can't express`
            ],
            Urdu: [
                `💔 کچھ احساسات الفاظ سے بھی گہرے ہوتے ہیں...`,
                `🌙 رات گئے، گہرے خیالات، شفا پاتے دل`,
                `🕯️ آہستہ آہستہ سیکھ رہا ہوں کہ کچھ چیزیں سمجھی نہیں جاتی`,
                `💫 کبھی کبھی اپنے آپ کو کھونا پڑتا ہے تاکہ خود کو ڈھونڈ سکو`,
                `🌊 آنسو وہ الفاظ ہیں جو دل ظاہر نہیں کر سکتا`
            ],
            Sindhi: [
                `💔 ڪجهه احساسات لفظن کان به اونهندا آهن...`,
                `🌙 رات جو، اونهڙا خيال، شفا پائيندڙ دل`,
                `🕯️ آهستي آهستي سکي رهيو آهيان ته ڪجهه شيون سمجهيون ناهين وينديون`,
                `💫 ڪڏهن ڪڏهن پاڻ کي وڃائڻو پوندو آهي ته جيئن پاڻ کي ڳولهي سگهجي`,
                `🌊 ڳوڙها اهي لفظ آهن جيڪي دل ظاهر نٿي ڪري سگهي`
            ]
        }
    };
    
    const modeData = templates[mode] || templates.normal;
    const langData = modeData[language] || modeData.English;
    
    // Add variety based on category
    let captions = [...langData];
    
    // Shuffle to get different ones each time
    for (let i = captions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [captions[i], captions[j]] = [captions[j], captions[i]];
    }
    
    if (category === 'gym') captions = captions.map(c => `💪 ${c} #gymlife #fitness #workout`);
    if (category === 'travel') captions = captions.map(c => `✈️ ${c} #travel #wanderlust #adventure`);
    if (category === 'coding') captions = captions.map(c => `💻 ${c} #coding #developer #tech`);
    if (category === 'love') captions = captions.map(c => `❤️ ${c} #love #romance #couplegoals`);
    if (category === 'study') captions = captions.map(c => `📚 ${c} #study #learning #success`);
    if (category === 'friendship') captions = captions.map(c => `👫 ${c} #friendship #besties`);
    if (category === 'nature') captions = captions.map(c => `🌿 ${c} #nature #peaceful #calm`);
    
    return captions.slice(0, 3);
}

// Image analysis function using Gemini Vision
async function analyzeImageWithGemini(imageBase64) {
    try {
        const imageData = imageBase64.split(',')[1];
        
        const prompt = `You are an AI vision expert. Analyze this image and respond with ONLY valid JSON in this exact format:
{
  "scene": "What is happening in the image? (one detailed sentence describing the main subject, action, and setting)",
  "vibe": "The overall mood/vibe (one word like: happy, peaceful, energetic, romantic, professional, funny, sad, creative, focused, calm, exciting, mysterious)",
  "objects": ["object1", "object2", "object3"],
  "colors": "dominant colors (2-3 words)",
  "people_count": number of people visible,
  "suggested_hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"]
}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: "image/jpeg", data: imageData } }
                    ]
                }],
                generationConfig: { 
                    temperature: 0.7, 
                    maxOutputTokens: 500,
                    topP: 0.9
                }
            })
        });

        const data = await response.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        // Extract JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            console.log('✅ Image analysis successful:', analysis.vibe);
            return analysis;
        }
        return null;
    } catch (error) {
        console.error('Analysis error:', error);
        return null;
    }
}

// Generate captions using AI with image context
async function generateAICaptions(imageBase64, platform, mode, language, category, emojiIntensity, isRoast, analysis) {
    try {
        const imageData = imageBase64.split(',')[1];
        if (!imageData) return null;
        
        // Build a rich prompt with image analysis
        const analysisText = analysis ? `
🎯 IMAGE ANALYSIS RESULTS:
- Scene: ${analysis.scene || 'Analyzing your image...'}
- Vibe: ${analysis.vibe || 'creative'}
- Objects: ${(analysis.objects || ['scene', 'moment']).join(', ')}
- Colors: ${analysis.colors || 'vibrant'}
- People: ${analysis.people_count || 'some'} people
` : 'Carefully analyze what is happening in this image.';

        const emojiLevel = emojiIntensity < 33 ? 'minimal (1-2 emojis max)' : (emojiIntensity < 66 ? 'moderate (3-4 emojis)' : 'many (5-6 emojis for extra fun)');
        
        let prompt = `You are a professional, creative social media caption writer. ${analysisText}

Generate 3 COMPLETELY DIFFERENT, UNIQUE, FRESH captions for this specific image.

REQUIREMENTS:
- Platform: ${platform.toUpperCase()}
- Style: ${isRoast ? 'ROAST/SAVAGE HUMOR' : mode.toUpperCase()}
- Category: ${category.toUpperCase()}
- Language: ${language}
- Emoji usage: ${emojiLevel}

${isRoast ? `
🔥 ROAST MODE - Be funny and savage but NOT mean:
- Make playful, witty observations about the image
- Use humor like "Bro really thought this was it 💀"
- Keep it entertaining and lighthearted
- Examples: "This image needs an apology letter 📝", "My eyes are blessed and cursed at the same time"
` : `
🎨 STYLE: ${mode.toUpperCase()}
${mode === 'romantic' ? '💕 Write dreamy, heartwarming captions about love and connection' : ''}
${mode === 'savage' ? '👑 Write bold, confident, unapologetic captions' : ''}
${mode === 'motivational' ? '💪 Write inspiring, powerful, uplifting captions' : ''}
${mode === 'emotional' ? '💫 Write deep, touching, heartfelt captions' : ''}
${mode === 'funny' ? '😂 Write hilarious, witty, entertaining captions' : ''}
${mode === 'normal' ? '✨ Write natural, relatable, authentic captions' : ''}
`}

CRITICAL RULES:
1. Each caption must be UNIQUE and DIFFERENT from each other
2. Caption 1: SHORT & PUNCHY (under 80 characters)
3. Caption 2: MEDIUM & ENGAGING (80-150 characters)  
4. Caption 3: LONGER & STORY-LIKE (150-250 characters)
5. MUST be RELEVANT to what's actually in the image
6. Be creative, specific, and avoid generic phrases

RESPOND ONLY with valid JSON:
{
  "captions": ["caption 1", "caption 2", "caption 3"]
}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: "image/jpeg", data: imageData } }
                    ]
                }],
                generationConfig: { 
                    temperature: 0.95, 
                    maxOutputTokens: 800,
                    topP: 0.95,
                    topK: 40
                }
            })
        });

        const data = await response.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        console.log('AI Response received, length:', text.length);
        
        // Clean and parse JSON
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.captions && parsed.captions.length >= 3) {
                console.log('✅ Successfully generated 3 unique captions with AI');
                return parsed.captions.slice(0, 3);
            }
        }
        
        // If parsing fails, try to extract lines
        const lines = text.split('\n').filter(l => l.includes('"') || (l.length > 15 && !l.includes('{')));
        if (lines.length >= 3) {
            const extracted = lines.slice(0, 3).map(l => l.replace(/["',]/g, '').trim());
            if (extracted[0].length > 10) {
                return extracted;
            }
        }
        
        return null;
    } catch (error) {
        console.error('AI generation error:', error);
        return null;
    }
}

app.post('/api/generate', async (req, res) => {
    const { platform, mode, language, category, emojiIntensity, imageBase64, isRoast } = req.body;
    
    console.log(`\n📸 New request: mode=${mode}, language=${language}, category=${category}, isRoast=${isRoast}`);
    
    try {
        let captions = [];
        let source = 'fallback';
        let analysis = null;
        
        // Step 1: Analyze image if provided
        if (imageBase64) {
            console.log('🔍 Analyzing image with Gemini Vision...');
            analysis = await analyzeImageWithGemini(imageBase64);
            if (analysis) {
                console.log(`✅ Analysis complete: Vibe=${analysis.vibe}, Scene=${analysis.scene?.substring(0, 50)}...`);
            } else {
                console.log('⚠️ Image analysis returned null, using creative fallback');
            }
        }
        
        // Step 2: Try AI generation with image context
        if (imageBase64 && GEMINI_API_KEY) {
            console.log('🤖 Generating AI captions...');
            const aiCaptions = await generateAICaptions(
                imageBase64, platform, mode, language, category, 
                emojiIntensity || 50, isRoast || false, analysis
            );
            
            if (aiCaptions && aiCaptions.length >= 3) {
                captions = aiCaptions;
                source = 'ai';
                console.log('✅ AI generated captions successfully!');
            } else {
                console.log('⚠️ AI generation returned insufficient captions');
            }
        }
        
        // Step 3: Fallback to creative library
        if (captions.length === 0) {
            console.log('📚 Using creative library fallback');
            captions = generateCreativeFallback(mode, language, category, platform, analysis);
            source = 'library';
        }
        
        // Step 4: Add hashtags for Instagram/TikTok
        const hashtags = {
            general: ['#viral', '#trending', '#explorepage', '#fyp'],
            gym: ['#gymlife', '#fitnessmotivation', '#workout', '#bodybuilding'],
            travel: ['#travelgram', '#wanderlust', '#exploremore', '#adventuretime'],
            coding: ['#codinglife', '#developer', '#programming', '#techworld'],
            love: ['#lovequotes', '#romantic', '#couplegoals', '#heartfelt'],
            study: ['#studymotivation', '#learning', '#education', '#successmindset'],
            friendship: ['#friendshipgoals', '#bestfriends', '#squad', '#brotherhood'],
            nature: ['#naturelovers', '#peaceful', '#calming', '#beautifulnature'],
            eid: ['#EidMubarak', '#EidCelebration', '#EidVibes', '#Blessed']
        };
        
        const relevantHashtags = hashtags[category] || hashtags.general;
        
        if (platform === 'instagram' || platform === 'tiktok') {
            // Randomly select 2-3 hashtags
            const numHashtags = Math.floor(Math.random() * 2) + 2; // 2 or 3
            const shuffled = [...relevantHashtags];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            const selectedHashtags = shuffled.slice(0, numHashtags);
            
            captions = captions.map(caption => {
                return `${caption} ${selectedHashtags.join(' ')}`;
            });
        }
        
        // Step 5: Adjust emoji intensity
        if (emojiIntensity !== undefined) {
            const emojiSets = {
                low: ['✨', '💫', '⭐'],
                medium: ['✨✨', '💫💫', '🌟🌟', '💕💕'],
                high: ['✨✨✨', '🌟🌟🌟', '💫💫💫', '🔥🔥🔥', '💕💕💕']
            };
            
            let intensityLevel = 'medium';
            if (emojiIntensity < 33) intensityLevel = 'low';
            else if (emojiIntensity > 66) intensityLevel = 'high';
            
            const emojisToAdd = emojiSets[intensityLevel];
            const randomEmojiSet = emojisToAdd[Math.floor(Math.random() * emojisToAdd.length)];
            
            captions = captions.map(caption => {
                // Check if caption already has emojis
                const hasEmojis = /[✨🌟💫⭐⚡🔥💪🎯💕🌸🌙☀️❤️💔]/.test(caption);
                if (!hasEmojis || intensityLevel === 'high') {
                    return `${randomEmojiSet} ${caption}`;
                }
                return caption;
            });
        }
        
        // Send response
        res.json({
            success: true,
            captions: captions.slice(0, 3),
            source: source,
            analysis: analysis || { 
                vibe: mode, 
                scene: `Your beautiful ${category} moment`,
                suggested_hashtags: hashtags[category]?.slice(0, 3) || ['#viral', '#trending']
            }
        });
        
        console.log(`📤 Response sent with ${captions.length} captions from ${source} source\n`);
        
    } catch (error) {
        console.error('❌ Server error:', error);
        
        // Ultimate fallback
        const fallbackCaptions = generateCreativeFallback(mode || 'normal', language || 'English', category || 'general', platform || 'instagram');
        res.json({
            success: true,
            captions: fallbackCaptions.slice(0, 3),
            source: 'emergency',
            error: error.message
        });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        gemini_configured: !!GEMINI_API_KEY
    });
});

app.listen(PORT, () => {
    console.log(`\n🚀 NeuroCaption AI Server Running!`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`🔑 Gemini API: ${GEMINI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
    console.log(`💡 Ready to generate unique captions!\n`);
});
