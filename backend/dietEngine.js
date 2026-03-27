const foods = {
    "South India": {
        breakfast: ["Idli with Sambar", "Dosa with Chutney", "Ragi Mudde", "Upma", "Pesarattu"],
        lunch: ["Brown Rice with Sambar and Cabbage Poriyal", "Bisi Bele Bath", "Kerala Red Rice with Fish Curry", "Lemon Rice with Curd"],
        dinner: ["Appam with Stew", "Chapati with Kurma", "Oats Dosa", "Mixed Veg Sambar with Quinoa"],
        snacks: ["Sundal", "Roasted Makhana", "Filter Coffee and Almonds", "Buttermilk and Fruits"]
    },
    "North India": {
        breakfast: ["Poha", "Stuffed Paneer Paratha", "Moong Dal Chilla", "Dalia", "Besan Chilla"],
        lunch: ["Roti with Dal Tadka and Sabzi", "Rajma Chawal", "Kadhi Pakora with Brown Rice", "Chicken Curry with Roti"],
        dinner: ["Roti with Palak Paneer", "Khichdi", "Grilled Chicken Tikka with Salad", "Mixed Veg Curry with Roti"],
        snacks: ["Roasted Chana", "Lassi (Salted)", "Fruit Chaat", "Sprouts Salad"]
    },
    "West India": {
        breakfast: ["Methi Thepla", "Poha", "Dhokla", "Kanda Poha", "Thalipeeth"],
        lunch: ["Bajra Roti with Pitla", "Dal Dhokli", "Gujarati Kadhi with Brown Rice", "Roti with Mixed Veg Sabzi"],
        dinner: ["Jowar Bhakri with Zunka", "Khichuri", "Misal with Pav", "Varan Bhaat"],
        snacks: ["Bhel (No sev)", "Roasted Peanuts", "Sol Kadhi", "Muthia"]
    },
    "East India": {
        breakfast: ["Chida Dahi", "Sattu Sharbat and Fruits", "Pithas (Steamed)", "Oats with Milk"],
        lunch: ["Rice with Macher Jhol (Fish Curry)", "Dalma with Rice", "Litti Chokha", "Mustard Fish Curry"],
        dinner: ["Roti with Veg Tarkari", "Chicken Stew with Roti", "Posto Veggies", "Muri Ghonto"],
        snacks: ["Jhal Muri", "Ghugni", "Roasted Makhana", "Green Tea and Almonds"]
    },
    "North-East India": {
        breakfast: ["Pukhlein", "Rice flour bread and Chai", "Boiled vegetables and eggs", "Bamboo shoot soup"],
        lunch: ["Jadoh (Pork/Chicken and Rice)", "Assamese Fish Thali", "Eromba", "Smoked Pork with bamboo shoot"],
        dinner: ["Boiled veggies with fish", "Thukpa", "Momo (Steamed, whole wheat)", "Gundruk soup with rice"],
        snacks: ["Green Tea", "Boiled Corn", "Pithas", "Fresh Fruits"]
    },
    "Central India": {
        breakfast: ["Poha", "Sabudana Khichdi", "Chana Samosa (Air fried)", "Dalia"],
        lunch: ["Roti with Dal Bafla", "Bhutte ki Kees", "Dal Gosht with Roti", "Rice with Kadhi"],
        dinner: ["Roti with Bhindi", "Palak Sabzi with Roti", "Khichdi", "Chicken Curry with Roti"],
        snacks: ["Roasted corn", "Chana chaat", "Nimbu Pani", "Roasted Chana"]
    }
};

const calculateBMR = (weight, height, age, isMale = true) => {
    return isMale 
        ? (10 * weight) + (6.25 * height) - (5 * age) + 5 
        : (10 * weight) + (6.25 * height) - (5 * age) - 161;
};

const calculateTDEE = (bmr, activityLevel) => {
    const multipliers = {
        'sedentary': 1.2, 'light': 1.375, 'moderate': 1.55, 'active': 1.725, 'very_active': 1.9
    };
    return bmr * (multipliers[activityLevel] || 1.2);
};

const parseIngredients = (mealName, scalingFactor) => {
    const ingredients = [];
    const name = mealName.toLowerCase();

    // Heuristics for adding ingredients based on meal name keywords
    const add = (item, baseQty, unit) => {
        ingredients.push({ item, qty: Math.round(baseQty * scalingFactor), unit });
    };

    if (name.includes("idli") || name.includes("dosa") || name.includes("uttapam")) add("Idli/Dosa (Prepared)", 150, "g");
    if (name.includes("rice") || name.includes("chawal") || name.includes("bhaat") || name.includes("jadoh") || name.includes("bath") || name.includes("khichdi")) add("Rice (Cooked)", 150, "g");
    if (name.includes("roti") || name.includes("chapati") || name.includes("thepla") || name.includes("paratha") || name.includes("litti")) add("Roti/Chapati", 2, "pcs");
    if (name.includes("bhakri") || name.includes("mudde")) add("Millet Flatbread/Mudde", 150, "g");
    if (name.includes("chicken")) add("Chicken (Prepared)", 150, "g");
    if (name.includes("fish") || name.includes("macher")) add("Fish (Prepared)", 150, "g");
    if (name.includes("pork")) add("Pork (Prepared)", 150, "g");
    if (name.includes("dal") || name.includes("sambar") || name.includes("kadhi") || name.includes("pitla") || name.includes("zunka")) add("Dal/Lentils (Cooked)", 150, "g");
    if (name.includes("paneer")) add("Paneer", 100, "g");
    if (name.includes("veg") || name.includes("sabzi") || name.includes("poriyal") || name.includes("stew") || name.includes("tarkari")) add("Mixed Vegetables (Cooked)", 150, "g");
    if (name.includes("poha") || name.includes("chida")) add("Poha (Prepared)", 150, "g");
    if (name.includes("oats")) add("Oats (Prepared)", 150, "g");
    if (name.includes("fruit")) add("Mixed Fruits", 150, "g");
    if (name.includes("chana") || name.includes("sundal") || name.includes("ghugni") || name.includes("misal")) add("Chana/Sprouts (Cooked)", 100, "g");
    if (name.includes("egg")) add("Eggs", 2, "pcs");
    if (name.includes("almond") || name.includes("makhana") || name.includes("peanut")) add("Nuts & Seeds", 30, "g");
    if (name.includes("milk") || name.includes("buttermilk") || name.includes("lassi") || name.includes("dahi") || name.includes("curd")) add("Milk/Curd", 150, "ml");

    // Fallback if nothing specific matched
    if (ingredients.length === 0) {
        add("Mixed Groceries (Uncategorized)", 100, "g");
    }

    // Determine total calories roughly just to display alongside meal
    let estimatedCals = Math.round(500 * scalingFactor); // Rough meal estimate

    return { ingredients, estimatedCals };
};

const generateDietPlan = (profile) => {
    const bmr = calculateBMR(parseFloat(profile.weight), parseFloat(profile.height), parseInt(profile.age));
    const tdee = calculateTDEE(bmr, profile.activity_level);
    
    let targetCalories = tdee;
    if (profile.goal === 'fat_loss') targetCalories = tdee - 500;
    
    const regionFood = foods[profile.region] || foods["North India"];
    const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const scalingFactor = targetCalories / 2000;

    let weeklyPlan = {};
    let groceryListMap = {};

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    days.forEach(day => {
        const bFastStr = getRandom(regionFood.breakfast);
        const lunchStr = getRandom(regionFood.lunch);
        const snackStr = getRandom(regionFood.snacks);
        const dinnerStr = getRandom(regionFood.dinner);

        const bFastParsed = parseIngredients(bFastStr, scalingFactor);
        const lunchParsed = parseIngredients(lunchStr, scalingFactor);
        const snackParsed = parseIngredients(snackStr, scalingFactor);
        const dinnerParsed = parseIngredients(dinnerStr, scalingFactor);

        // Map into daily plan structure
        const formatMeal = (name, parsed) => {
            let desc = `${name} [${parsed.ingredients.map(i => `${i.qty}${i.unit}`).join(', ')}]`;
            
            // Aggregate in grocery list
            parsed.ingredients.forEach(ing => {
                if(!groceryListMap[ing.item]) {
                    groceryListMap[ing.item] = { qty: 0, unit: ing.unit };
                }
                groceryListMap[ing.item].qty += ing.qty;
            });

            return desc;
        };

        weeklyPlan[day] = {
            breakfast: formatMeal(bFastStr, bFastParsed),
            lunch: formatMeal(lunchStr, lunchParsed),
            snack: formatMeal(snackStr, snackParsed),
            dinner: formatMeal(dinnerStr, dinnerParsed)
        };
    });

    // Format grocery list (e.g. tracking kg instead of 1500g)
    let finalGroceryList = [];
    for (let item in groceryListMap) {
        let total = groceryListMap[item].qty;
        let unit = groceryListMap[item].unit;
        
        if (unit === 'g' && total >= 1000) {
            total = (total / 1000).toFixed(2);
            unit = 'kg';
        } else if (unit === 'ml' && total >= 1000) {
            total = (total / 1000).toFixed(2);
            unit = 'L';
        }
        
        finalGroceryList.push({ item, amount: `${total} ${unit}` });
    }

    let plan = {
        targetCalories: Math.round(targetCalories),
        weeklyPlan,
        groceryList: finalGroceryList,
        diseaseAdjustments: []
    };

    if (profile.disease) {
        const disease = profile.disease.toLowerCase();
        if (disease.includes('diabetes')) plan.diseaseAdjustments.push("Low GI focus: Ensure millets and high-fiber grains.");
        if (disease.includes('hypertension')) plan.diseaseAdjustments.push("Low Sodium focus: Minimize salt.");
        if (disease.includes('thyroid')) plan.diseaseAdjustments.push("Thyroid support: Balanced iodine, avoid raw cruciferous veg.");
        if (disease.includes('obesity')) plan.diseaseAdjustments.push("Obesity management: High protein, vegetable volume eating.");
    }

    return plan;
};

module.exports = generateDietPlan;
