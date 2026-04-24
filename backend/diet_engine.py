import math
import random

foods = {
    "South India": {
        "breakfast": ["Idli with Sambar", "Dosa with Chutney", "Ragi Mudde", "Upma", "Pesarattu"],
        "lunch": ["Brown Rice with Sambar and Cabbage Poriyal", "Bisi Bele Bath", "Kerala Red Rice with Fish Curry", "Lemon Rice with Curd"],
        "dinner": ["Appam with Stew", "Chapati with Kurma", "Oats Dosa", "Mixed Veg Sambar with Quinoa"],
        "snacks": ["Sundal", "Roasted Makhana", "Filter Coffee and Almonds", "Buttermilk and Fruits"]
    },
    "North India": {
        "breakfast": ["Poha", "Stuffed Paneer Paratha", "Moong Dal Chilla", "Dalia", "Besan Chilla"],
        "lunch": ["Roti with Dal Tadka and Sabzi", "Rajma Chawal", "Kadhi Pakora with Brown Rice", "Chicken Curry with Roti"],
        "dinner": ["Roti with Palak Paneer", "Khichdi", "Grilled Chicken Tikka with Salad", "Mixed Veg Curry with Roti"],
        "snacks": ["Roasted Chana", "Lassi (Salted)", "Fruit Chaat", "Sprouts Salad"]
    },
    "West India": {
        "breakfast": ["Methi Thepla", "Poha", "Dhokla", "Kanda Poha", "Thalipeeth"],
        "lunch": ["Bajra Roti with Pitla", "Dal Dhokli", "Gujarati Kadhi with Brown Rice", "Roti with Mixed Veg Sabzi"],
        "dinner": ["Jowar Bhakri with Zunka", "Khichuri", "Misal with Pav", "Varan Bhaat"],
        "snacks": ["Bhel (No sev)", "Roasted Peanuts", "Sol Kadhi", "Muthia"]
    },
    "East India": {
        "breakfast": ["Chida Dahi", "Sattu Sharbat and Fruits", "Pithas (Steamed)", "Oats with Milk"],
        "lunch": ["Rice with Macher Jhol (Fish Curry)", "Dalma with Rice", "Litti Chokha", "Mustard Fish Curry"],
        "dinner": ["Roti with Veg Tarkari", "Chicken Stew with Roti", "Posto Veggies", "Muri Ghonto"],
        "snacks": ["Jhal Muri", "Ghugni", "Roasted Makhana", "Green Tea and Almonds"]
    },
    "North-East India": {
        "breakfast": ["Pukhlein", "Rice flour bread and Chai", "Boiled vegetables and eggs", "Bamboo shoot soup"],
        "lunch": ["Jadoh (Pork/Chicken and Rice)", "Assamese Fish Thali", "Eromba", "Smoked Pork with bamboo shoot"],
        "dinner": ["Boiled veggies with fish", "Thukpa", "Momo (Steamed, whole wheat)", "Gundruk soup with rice"],
        "snacks": ["Green Tea", "Boiled Corn", "Pithas", "Fresh Fruits"]
    },
    "Central India": {
        "breakfast": ["Poha", "Sabudana Khichdi", "Chana Samosa (Air fried)", "Dalia"],
        "lunch": ["Roti with Dal Bafla", "Bhutte ki Kees", "Dal Gosht with Roti", "Rice with Kadhi"],
        "dinner": ["Roti with Bhindi", "Palak Sabzi with Roti", "Khichdi", "Chicken Curry with Roti"],
        "snacks": ["Roasted corn", "Chana chaat", "Nimbu Pani", "Roasted Chana"]
    }
}

def calculate_BMR(weight, height, age, is_male=True):
    if is_male:
        return (10 * weight) + (6.25 * height) - (5 * age) + 5
    else:
        return (10 * weight) + (6.25 * height) - (5 * age) - 161

def calculate_TDEE(bmr, activity_level):
    multipliers = {
        'sedentary': 1.2, 'light': 1.375, 'moderate': 1.55, 'active': 1.725, 'very_active': 1.9
    }
    return bmr * multipliers.get(activity_level, 1.2)

def parse_ingredients(meal_name, scaling_factor):
    ingredients = []
    name = meal_name.lower()

    def add(item, base_qty, unit):
        ingredients.append({"item": item, "qty": round(base_qty * scaling_factor), "unit": unit})

    if "idli" in name or "dosa" in name or "uttapam" in name: add("Idli/Dosa (Prepared)", 150, "g")
    if "rice" in name or "chawal" in name or "bhaat" in name or "jadoh" in name or "bath" in name or "khichdi" in name: add("Rice (Cooked)", 150, "g")
    if "roti" in name or "chapati" in name or "thepla" in name or "paratha" in name or "litti" in name: add("Roti/Chapati", 2, "pcs")
    if "bhakri" in name or "mudde" in name: add("Millet Flatbread/Mudde", 150, "g")
    if "chicken" in name: add("Chicken (Prepared)", 150, "g")
    if "fish" in name or "macher" in name: add("Fish (Prepared)", 150, "g")
    if "pork" in name: add("Pork (Prepared)", 150, "g")
    if "dal" in name or "sambar" in name or "kadhi" in name or "pitla" in name or "zunka" in name: add("Dal/Lentils (Cooked)", 150, "g")
    if "paneer" in name: add("Paneer", 100, "g")
    if "veg" in name or "sabzi" in name or "poriyal" in name or "stew" in name or "tarkari" in name: add("Mixed Vegetables (Cooked)", 150, "g")
    if "poha" in name or "chida" in name: add("Poha (Prepared)", 150, "g")
    if "oats" in name: add("Oats (Prepared)", 150, "g")
    if "fruit" in name: add("Mixed Fruits", 150, "g")
    if "chana" in name or "sundal" in name or "ghugni" in name or "misal" in name: add("Chana/Sprouts (Cooked)", 100, "g")
    if "egg" in name: add("Eggs", 2, "pcs")
    if "almond" in name or "makhana" in name or "peanut" in name: add("Nuts & Seeds", 30, "g")
    if "milk" in name or "buttermilk" in name or "lassi" in name or "dahi" in name or "curd" in name: add("Milk/Curd", 150, "ml")

    if len(ingredients) == 0:
        add("Mixed Groceries (Uncategorized)", 100, "g")

    estimated_cals = round(500 * scaling_factor)
    return {"ingredients": ingredients, "estimatedCals": estimated_cals}

def generate_diet_plan(profile):
    bmr = calculate_BMR(float(profile.get('weight', 0)), float(profile.get('height', 0)), int(profile.get('age', 0)))
    tdee = calculate_TDEE(bmr, profile.get('activity_level', 'sedentary'))

    target_calories = tdee
    if profile.get('goal') == 'fat_loss':
        target_calories = tdee - 500

    region = profile.get('region', "North India")
    region_food = foods.get(region, foods["North India"])
    
    scaling_factor = target_calories / 2000

    weekly_plan = {}
    grocery_list_map = {}

    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    for day in days:
        b_fast_str = random.choice(region_food["breakfast"])
        lunch_str = random.choice(region_food["lunch"])
        snack_str = random.choice(region_food["snacks"])
        dinner_str = random.choice(region_food["dinner"])

        b_fast_parsed = parse_ingredients(b_fast_str, scaling_factor)
        lunch_parsed = parse_ingredients(lunch_str, scaling_factor)
        snack_parsed = parse_ingredients(snack_str, scaling_factor)
        dinner_parsed = parse_ingredients(dinner_str, scaling_factor)

        def format_meal(name, parsed):
            ingredients_str = ", ".join([f"{i['qty']}{i['unit']}" for i in parsed['ingredients']])
            desc = f"{name} [{ingredients_str}]"
            
            for ing in parsed['ingredients']:
                item_name = ing['item']
                if item_name not in grocery_list_map:
                    grocery_list_map[item_name] = {"qty": 0, "unit": ing['unit']}
                grocery_list_map[item_name]["qty"] += ing['qty']

            return desc

        weekly_plan[day] = {
            "breakfast": format_meal(b_fast_str, b_fast_parsed),
            "lunch": format_meal(lunch_str, lunch_parsed),
            "snack": format_meal(snack_str, snack_parsed),
            "dinner": format_meal(dinner_str, dinner_parsed)
        }

    final_grocery_list = []
    for item, data in grocery_list_map.items():
        total = data['qty']
        unit = data['unit']

        if unit == 'g' and total >= 1000:
            total = f"{(total / 1000.0):.2f}"
            unit = 'kg'
        elif unit == 'ml' and total >= 1000:
            total = f"{(total / 1000.0):.2f}"
            unit = 'L'
        
        final_grocery_list.append({"item": item, "amount": f"{total} {unit}"})

    disease_adjustments = []
    disease = profile.get('disease', '').lower()
    if 'diabetes' in disease: disease_adjustments.append("Low GI focus: Ensure millets and high-fiber grains.")
    if 'hypertension' in disease: disease_adjustments.append("Low Sodium focus: Minimize salt.")
    if 'thyroid' in disease: disease_adjustments.append("Thyroid support: Balanced iodine, avoid raw cruciferous veg.")
    if 'obesity' in disease: disease_adjustments.append("Obesity management: High protein, vegetable volume eating.")

    plan = {
        "targetCalories": round(target_calories),
        "weeklyPlan": weekly_plan,
        "groceryList": final_grocery_list,
        "diseaseAdjustments": disease_adjustments
    }

    return plan
