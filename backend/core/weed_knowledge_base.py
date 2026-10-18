"""
Global Agricultural Weed Knowledge Base
Covers the world's most widespread and destructive agricultural weeds (FAO & Global Invasive Species Database).
Provides botanical binomial nomenclature (Scientific Latin), multilingual common names,
and internationally standardized active chemical ingredients (FAO/EPA standards).
"""

from typing import Dict, Any, Optional

GLOBAL_WEEDS: list[Dict[str, Any]] = [
    {
        "id": "cyperus-rotundus",
        "scientific": "Cyperus rotundus",
        "family": "Cyperaceae",
        "name_en": "Purple Nutsedge (Nutgrass)",
        "name_my": "မြက်မုန်ညင်း (နတ်မြက်)",
        "description_en": "Considered the world's worst agricultural weed. Perennial sedge with extensive underground tubers, infesting over 50 crops in 90+ tropical and subtropical countries.",
        "description_my": "ကမ္ဘာ့အဆိုးရွားဆုံး ပေါင်းပင်အဖြစ် သတ်မှတ်ခံရပြီး မြေအောက်ဥများဖြင့် အလွန်ပြန့်ပွားလွယ်သည်။ အပူပိုင်းနှင့် အပူလျော့ပိုင်း နိုင်ငံ ၉၀ ကျော်ရှိ သီးနှံမျိုးစုံတွင် အဓိက ကျရောက်သည်။",
        "herbicide": {
            "name": "Halosulfuron-methyl 75% WG",
            "activeIngredient": "Halosulfuron-methyl",
            "ratePerAcre": 0.09,
            "suitableCrop": "Rice, Corn, Sugarcane, Vegetables / စပါး၊ ပြောင်း၊ ကြံ",
            "targetWeed": "Nutgrass and sedges / မြက်မုန်ညင်းနှင့် မုန်ညင်းနွယ်ဝင်များ",
            "applicationMethod": "Post-emergence foliar spray with non-ionic surfactant / ပေါင်းပင် ပေါက်ပြီး အရွက်ဖျန်းဆေး",
            "usage": "Apply at 3-5 leaf stage of nutgrass. Ensure uniform soil moisture for best uptake.",
            "safety": "Wear protective gloves, eye goggles, and mask. Avoid application before impending rain."
        }
    },
    {
        "id": "echinochloa-crus-galli",
        "scientific": "Echinochloa crus-galli",
        "family": "Poaceae",
        "name_en": "Barnyard Grass (Water Grass)",
        "name_my": "မြက်သီး (ရေမြက်သီး)",
        "description_en": "One of the most destructive annual grass weeds in global rice, maize, and vegetable cultivation. Mimics rice seedlings in early stages and rapidly depletes soil nitrogen.",
        "description_my": "ကမ္ဘာ့စပါးနှင့် ပြောင်းစိုက်ခင်းများတွင် အဓိက အန္တရာယ်အပေးဆုံး ပေါင်းမြက်ဖြစ်ပြီး အပင်ငယ်စဉ် စပါးပင်နှင့် ခွဲရခက်ခဲကာ မြေဆီလွှာ နိုက်ထရိုဂျင်ကို အလျင်အမြန် စုပ်ယူဖျက်ဆီးသည်။",
        "herbicide": {
            "name": "Pretilachlor 50% EC / Penoxsulam",
            "activeIngredient": "Pretilachlor (or Penoxsulam)",
            "ratePerAcre": 0.5,
            "suitableCrop": "Paddy Rice (Transplanted & Wet-seeded) / စပါး",
            "targetWeed": "Barnyard grass and annual grasses / မြက်သီးနှင့် နှစ်စဉ်ခံ မြက်မျိုးများ",
            "applicationMethod": "Pre-emergence to early post-emergence foliar spray / စပါးစိုက်ပြီး ၃-၅ ရက်အတွင်း ဖျန်းပေးခြင်း",
            "usage": "Apply 3-5 days after transplanting with thin water layer maintained for 2-3 days.",
            "safety": "Keep water retained in field to avoid runoff to aquatic environments. Wear full PPE."
        }
    },
    {
        "id": "eleusine-indica",
        "scientific": "Eleusine indica",
        "family": "Poaceae",
        "name_en": "Goosegrass (Wiregrass)",
        "name_my": "မြက်သီးငှက်မွှေး (ဆင်ခြေရာမြက်)",
        "description_en": "Extremely tough, tufted annual grass with strong fibrous roots that tolerate heavy compaction, mowing, and drought across all continents.",
        "description_my": "အလွန်ခံနိုင်ရည်ရှိပြီး အမြစ်တွယ်အားကောင်းသည့် မြက်မျိုးဖြစ်ကာ မြေကျစ်လစ်မှု၊ ခြောက်သွေ့မှုဒဏ်ကို ကမ္ဘာအနှံ့ စိုက်ပျိုးခင်းများတွင် ခံနိုင်ရည်ရှိသည်။",
        "herbicide": {
            "name": "Glufosinate-ammonium 15% SL / Clethodim",
            "activeIngredient": "Glufosinate-ammonium (or Clethodim)",
            "ratePerAcre": 0.8,
            "suitableCrop": "Fruit Orchards, Cotton, Soybean, Fallow land / သစ်သီးခြံ၊ ဝါ၊ ပဲပုပ်",
            "targetWeed": "Goosegrass and glyphosate-resistant grasses / မြက်သီးငှက်မွှေးနှင့် ခံနိုင်ရည်ရှိမြက်များ",
            "applicationMethod": "Directed post-emergence foliar spray / ပေါင်းပင်ရှိရာသို့ ဦးတည်ဖျန်းခြင်း",
            "usage": "Spray during active vegetative growth before seed head emergence for maximum control.",
            "safety": "Avoid contact with crop foliage or green bark. Use drift-reduction nozzles."
        }
    },
    {
        "id": "amaranthus-sp",
        "scientific": "Amaranthus viridis",
        "family": "Amaranthaceae",
        "name_en": "Slender Amaranth (Pigweed)",
        "name_my": "ဟင်းနုနယ်ရိုင်း (ဝက်မြေတိုး)",
        "description_en": "Widespread fast-growing broadleaf weed producing tens of thousands of seeds per plant, infesting vegetables, grains, and row crops worldwide.",
        "description_my": "အစေ့အမြောက်အမြား ထုတ်လုပ်နိုင်ပြီး လျင်မြန်စွာ ကြီးထွားနိုင်သည့် ရွက်ပြန့်ပေါင်းပင်ဖြစ်ကာ ကမ္ဘာ့ဟင်းသီးဟင်းရွက်နှင့် သီးနှံခင်းများတွင် ကျရောက်သည်။",
        "herbicide": {
            "name": "2,4-D Amine 58% SL / Metribuzin",
            "activeIngredient": "2,4-Dichlorophenoxyacetic acid",
            "ratePerAcre": 0.5,
            "suitableCrop": "Corn, Wheat, Sugarcane, Rice / ပြောင်း၊ ဂျုံ၊ ကြံ၊ စပါး",
            "targetWeed": "Broadleaf weeds including Pigweed / ရွက်ပြန့်ပေါင်းပင်မျိုးစုံ",
            "applicationMethod": "Post-emergence broadcast spray / ပေါင်းပင် ပေါက်ပြီး ဖြန့်ကြက်ဖျန်းခြင်း",
            "usage": "Apply 20-25 days after crop emergence when weeds are 2-4 inches tall.",
            "safety": "Do not spray during high temperatures or wind to avoid drift to sensitive broadleaf crops (cotton/beans)."
        }
    },
    {
        "id": "digitaria-sanguinalis",
        "scientific": "Digitaria sanguinalis",
        "family": "Poaceae",
        "name_en": "Large Crabgrass (Hairy Crabgrass)",
        "name_my": "ဂဏန်းခြေမြက် (ကြက်မောက်မြက်)",
        "description_en": "Prostrate or decumbent annual grass that roots readily at the nodes, forming dense mats that choke out turf, corn, vegetables, and legumes globally.",
        "description_my": "အဆစ်များမှ အမြစ်ထွက်ပြီး မြေပြင်ပေါ် အုပ်မိုးပေါက်ရောက်ကာ သီးနှံပင်များကို နေရောင်နှင့် မြေဆီလွှာ အာဟာရ မရအောင် လွှမ်းမိုးဖျက်ဆီးသည်။",
        "herbicide": {
            "name": "Quizalofop-p-ethyl 5% EC",
            "activeIngredient": "Quizalofop-p-ethyl",
            "ratePerAcre": 0.4,
            "suitableCrop": "Soybean, Groundnut, Cotton, Pulses / ပဲပုပ်၊ မြေပဲ၊ ဝါ၊ ပဲမျိုးစုံ",
            "targetWeed": "Annual and perennial grass weeds / နှစ်ရှည်နှင့် နှစ်စဉ် မြက်မျိုးစုံ",
            "applicationMethod": "Selective post-emergence foliar spray / ရွက်ဖျန်းဆေး",
            "usage": "Apply at 3-5 leaf stage of crabgrass. Safe on broadleaf crops.",
            "safety": "Flammable liquid; keep away from heat. Wash thoroughly with soap and water after handling."
        }
    },
    {
        "id": "parthenium-hysterophorus",
        "scientific": "Parthenium hysterophorus",
        "family": "Asteraceae",
        "name_en": "Parthenium (Congress Grass / Santa Maria)",
        "name_my": "ဘိန်းစာမြက် (ဇာမဏီပင်)",
        "description_en": "Highly aggressive invasive alien weed causing major agricultural yield losses and severe allergic dermatitis/respiratory issues in livestock and humans.",
        "description_my": "အလွန်ပြန့်ပွားလွယ်ပြီး လူနှင့် တိရစ္ဆာန်များကို ဓာတ်မတည့် ယားယံမှုဖြစ်စေကာ သီးနှံအထွက်နှုန်းကို ဆိုးရွားစွာ လျှော့ချပစ်သည့် ကမ္ဘာကျော် ကျူးကျော်ပေါင်းပင်။",
        "herbicide": {
            "name": "Glyphosate 41% SL / 2,4-D Ethyl Ester",
            "activeIngredient": "Glyphosate (or 2,4-D)",
            "ratePerAcre": 1.0,
            "suitableCrop": "Non-crop areas, Field borders, Fallow land / သီးနှံပြင်ပ မြေလွတ်နှင့် လယ်ကန်သင်း",
            "targetWeed": "Parthenium and aggressive perennials / ဘိန်းစာမြက်နှင့် နှစ်ရှည်ပေါင်းပင်များ",
            "applicationMethod": "Directed foliar spray before flowering / ပန်းမပွင့်မီ အပင်ဖျန်းပေးခြင်း",
            "usage": "Apply before flowering to prevent viable seed dissemination.",
            "safety": "CRITICAL: Wear full face mask and protective overalls to prevent airborne allergic pollen and sap contact."
        }
    },
    {
        "id": "cynodon-dactylon",
        "scientific": "Cynodon dactylon",
        "family": "Poaceae",
        "name_en": "Bermuda Grass (Couch Grass)",
        "name_my": "မြက်ခင်းမြက် (ဒူဗာမြက်)",
        "description_en": "Extremely drought-tolerant perennial grass forming deep rhizomes and surface stolons, choking orchards, vineyards, sugarcane, and cotton worldwide.",
        "description_my": "မြေအောက်ပင်စည်နှင့် အမြစ်ကွန်ရက်ဖြင့် ရှင်သန်နိုင်စွမ်း အလွန်မြင့်ပြီး မိုးခေါင်ဒဏ်ခံနိုင်သော နှစ်ရှည်မြက်ဆိုး ဖြစ်သည်။",
        "herbicide": {
            "name": "Fluazifop-P-butyl / Glyphosate",
            "activeIngredient": "Fluazifop-P-butyl",
            "ratePerAcre": 0.6,
            "suitableCrop": "Broadleaf Crops, Orchards, Sugarcane / သစ်သီးခြံ၊ ကြံ၊ ရွက်ပြန့်သီးနှံ",
            "targetWeed": "Perennial grasses with rhizomes / မြေအောက်အမြစ်ရှိ နှစ်ရှည်မြက်ဆိုးများ",
            "applicationMethod": "Foliar systemic spray / အပင်တွင်းစိမ့်ဝင် ရွက်ဖျန်းဆေး",
            "usage": "Apply when grass has 4-8 inches of fresh vigorous green growth.",
            "safety": "Systemic herbicide; do not cultivate soil for 7 days after spraying to allow translocation."
        }
    },
    {
        "id": "eichhornia-crassipes",
        "scientific": "Pontederia crassipes (Eichhornia)",
        "family": "Pontederiaceae",
        "name_en": "Water Hyacinth",
        "name_my": "ဗေဒါပင် (ရေဗေဒါ)",
        "description_en": "World's most problematic free-floating aquatic weed, clogging irrigation canals, paddy drainage, and rivers in tropical and subtropical regions.",
        "description_my": "ကမ္ဘာ့ဆည်မြောင်း၊ ရေစီးမြောင်းနှင့် ရေသွင်းစပါးခင်းများကို ပိတ်ဆို့ဖျက်ဆီးသည့် နံပါတ်တစ် ရေပေါ်ကျူးကျော် ပေါင်းပင်။",
        "herbicide": {
            "name": "Diquat dibromide / 2,4-D Amine",
            "activeIngredient": "2,4-D Amine (or Diquat)",
            "ratePerAcre": 1.2,
            "suitableCrop": "Aquatic canals, Agricultural drainage / ဆည်မြောင်း၊ ရေနုတ်မြောင်း",
            "targetWeed": "Water hyacinth and floating weeds / ဗေဒါနှင့် ရေပေါ်ပေါင်းပင်များ",
            "applicationMethod": "High-volume surface foliar spray / ရွက်ဖျန်းဆေး",
            "usage": "Spray actively growing green rosettes. Treat in sections to prevent sudden oxygen depletion.",
            "safety": "Observe local water withdrawal restrictions for irrigation following treatment."
        }
    }
]

def get_weed_by_scientific(scientific: str, lang: str = "en") -> Optional[Dict[str, Any]]:
    """Find weed by scientific name with language localization."""
    s_clean = scientific.strip().lower()
    for w in GLOBAL_WEEDS:
        if w["scientific"].lower() in s_clean or s_clean in w["scientific"].lower():
            return format_weed_output(w, lang)
    return None

def get_fallback_weed(lang: str = "en", index: int = 0) -> Dict[str, Any]:
    """Return default fallback weed from global knowledge base."""
    idx = index % len(GLOBAL_WEEDS)
    return format_weed_output(GLOBAL_WEEDS[idx], lang)

def format_weed_output(weed: Dict[str, Any], lang: str = "en") -> Dict[str, Any]:
    """Localize weed data to the requested language (en or my)."""
    is_my = (lang == "my")
    name = weed["name_my"] if is_my else weed["name_en"]
    description = weed["description_my"] if is_my else weed["description_en"]
    
    h = weed["herbicide"].copy()
    
    return {
        "id": weed["id"],
        "name": name,
        "scientific": weed["scientific"],
        "family": weed.get("family", "Unknown"),
        "description": description,
        "herbicide": h,
        "is_global_standard": True
    }
