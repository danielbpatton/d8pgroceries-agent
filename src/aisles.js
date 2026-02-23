// aisles.js — Publix store section definitions, item categorization, and aisle grouping
// Pure functions, no side effects.

// Sections are listed in typical Publix store walk order.
// Each section has a display name, sort order, and keyword list for categorization.
const SECTIONS = [
  {
    name: "Produce",
    order: 1,
    keywords: [
      "apple", "apples", "banana", "bananas", "orange", "oranges", "grape", "grapes",
      "lemon", "lemons", "lime", "limes", "berry", "berries", "strawberry", "strawberries",
      "blueberry", "blueberries", "raspberry", "raspberries", "blackberry", "blackberries",
      "cherry", "cherries", "peach", "peaches", "plum", "plums", "pear", "pears",
      "mango", "mangoes", "pineapple", "watermelon", "cantaloupe", "melon", "kiwi",
      "avocado", "avocados", "tomato", "tomatoes", "lettuce", "spinach", "kale",
      "cabbage", "broccoli", "cauliflower", "carrot", "carrots", "celery", "cucumber",
      "cucumbers", "zucchini", "squash", "pepper", "peppers", "bell pepper",
      "onion", "onions", "garlic", "potato", "potatoes", "sweet potato", "sweet potatoes",
      "yam", "yams", "corn", "asparagus", "artichoke", "brussels sprout", "brussels sprouts",
      "beet", "beets", "radish", "radishes", "mushroom", "mushrooms", "cilantro",
      "parsley", "basil", "mint", "ginger", "jalapeño", "jalapeno", "scallion", "scallions",
      "leek", "leeks", "shallot", "shallots", "fennel", "arugula", "chard",
      "collard greens", "romaine", "iceberg", "mixed greens", "salad mix",
      "fruit", "vegetable", "vegetables", "produce", "fresh herbs"
    ]
  },
  {
    name: "Deli",
    order: 2,
    keywords: [
      "deli", "deli meat", "deli cheese", "ham", "salami", "pepperoni",
      "turkey breast", "roast beef", "prosciutto", "pancetta", "mortadella",
      "pastrami", "bologna", "liverwurst", "hummus", "olive bar",
      "prepared salad", "coleslaw", "potato salad", "mac salad", "macaroni salad"
    ]
  },
  {
    name: "Bakery",
    order: 3,
    keywords: [
      "bread", "baguette", "ciabatta", "sourdough", "croissant", "muffin",
      "bagel", "bagels", "roll", "rolls", "bun", "buns", "cake", "cupcake",
      "pie", "pastry", "donut", "doughnut", "cookie", "cookies", "brownie",
      "brownies", "pita", "naan", "bakery", "loaf", "sliced bread",
      "whole wheat bread", "white bread", "multigrain bread", "rye bread"
    ]
  },
  {
    name: "Meat & Seafood",
    order: 4,
    keywords: [
      "chicken", "beef", "steak", "ground beef", "ground turkey", "ground pork",
      "turkey", "pork", "bacon", "sausage", "sausages", "lamb", "veal", "duck",
      "salmon", "shrimp", "lobster", "crab", "tilapia", "cod", "halibut",
      "mahi", "tuna steak", "scallop", "scallops", "clam", "clams", "oyster",
      "oysters", "mussels", "fish", "seafood", "meat", "brisket", "ribs",
      "pork chops", "pork loin", "pork tenderloin", "sirloin", "ribeye",
      "chicken wings", "chicken thighs", "chicken breast", "chicken drumstick",
      "hot dog", "hot dogs", "bratwurst", "kielbasa", "chorizo",
      "Italian sausage", "andouille"
    ]
  },
  {
    name: "Dairy & Eggs",
    order: 5,
    keywords: [
      "milk", "whole milk", "skim milk", "2% milk", "oat milk", "almond milk",
      "soy milk", "cream", "half and half", "creamer", "heavy cream",
      "whipping cream", "butter", "unsalted butter", "margarine",
      "cheese", "cheddar", "mozzarella", "parmesan", "parmigiano", "brie",
      "gouda", "swiss", "provolone", "feta", "ricotta", "cottage cheese",
      "cream cheese", "colby", "pepper jack", "american cheese",
      "sour cream", "yogurt", "greek yogurt", "kefir",
      "egg", "eggs", "egg whites", "egg substitute", "dairy"
    ]
  },
  {
    name: "Frozen Foods",
    order: 6,
    keywords: [
      "frozen", "ice cream", "gelato", "sorbet", "sherbet", "popsicle",
      "ice pop", "frozen pizza", "frozen meal", "frozen dinner",
      "frozen vegetables", "frozen fruit", "frozen berries",
      "frozen fries", "french fries", "frozen waffle", "frozen burrito",
      "tv dinner", "lean cuisine", "stouffer", "birds eye", "green giant frozen",
      "frozen edamame", "frozen corn", "frozen peas", "tater tots"
    ]
  },
  {
    name: "Canned & Jarred Goods",
    order: 7,
    keywords: [
      "canned", "can of", "tomato sauce", "pasta sauce", "marinara sauce",
      "salsa", "tomato paste", "diced tomatoes", "crushed tomatoes",
      "tomato soup", "chicken broth", "beef broth", "vegetable broth",
      "chicken stock", "beef stock", "bone broth", "coconut milk",
      "refried beans", "black beans", "kidney beans", "chickpeas",
      "garbanzo beans", "lentils", "pinto beans", "navy beans",
      "canned tuna", "canned salmon", "sardines", "anchovies",
      "clam chowder", "soup", "broth", "stock",
      "artichoke hearts", "roasted peppers", "olives", "capers",
      "pickles", "pickle relish", "jam", "jelly", "preserves",
      "peanut butter", "almond butter", "cashew butter", "nut butter",
      "honey", "maple syrup", "agave", "applesauce", "fruit cup"
    ]
  },
  {
    name: "Pasta, Rice & Grains",
    order: 8,
    keywords: [
      "pasta", "spaghetti", "penne", "rigatoni", "fettuccine", "linguine",
      "fusilli", "rotini", "farfalle", "lasagna noodles", "orzo", "couscous",
      "rice", "brown rice", "white rice", "jasmine rice", "basmati rice",
      "arborio rice", "wild rice", "fried rice mix", "quinoa", "oats",
      "rolled oats", "steel cut oats", "barley", "farro", "bulgur",
      "polenta", "grits", "cornmeal", "noodle", "noodles",
      "ramen noodles", "udon noodles", "soba noodles", "rice noodles",
      "egg noodles", "mac and cheese", "macaroni"
    ]
  },
  {
    name: "Breakfast & Cereal",
    order: 9,
    keywords: [
      "cereal", "granola", "muesli", "instant oatmeal", "oatmeal packet",
      "pancake mix", "waffle mix", "pancake syrup", "breakfast bar",
      "pop tart", "toaster strudel", "cream of wheat",
      "cheerios", "corn flakes", "frosted flakes", "rice krispies",
      "special k", "lucky charms", "granola bar", "breakfast cereal"
    ]
  },
  {
    name: "Snacks & Chips",
    order: 10,
    keywords: [
      "chips", "potato chips", "tortilla chips", "crackers", "pretzels",
      "popcorn", "trail mix", "mixed nuts", "nuts",
      "almonds", "cashews", "peanuts", "walnuts", "pecans", "pistachios",
      "macadamia nuts", "sunflower seeds", "pumpkin seeds", "pepitas",
      "protein bar", "energy bar", "kind bar", "clif bar",
      "fruit snacks", "gummy bears", "gummy worms", "candy",
      "chocolate bar", "snickers", "kit kat", "reeses", "m&ms",
      "rice cakes", "pork rinds", "beef jerky", "snack"
    ]
  },
  {
    name: "Beverages",
    order: 11,
    keywords: [
      "water", "sparkling water", "club soda", "tonic water",
      "soda", "cola", "diet coke", "pepsi", "sprite", "dr pepper",
      "ginger ale", "root beer", "orange juice", "apple juice",
      "cranberry juice", "grape juice", "lemonade", "fruit punch",
      "iced tea", "green tea bottle", "sports drink", "gatorade",
      "powerade", "energy drink", "red bull", "monster energy",
      "kombucha", "coconut water", "juice box", "capri sun",
      "drink mix", "kool-aid", "flavor packets"
    ]
  },
  {
    name: "Coffee & Tea",
    order: 12,
    keywords: [
      "coffee", "ground coffee", "coffee beans", "whole bean coffee",
      "k-cup", "k cup", "pod coffee", "espresso", "instant coffee",
      "cold brew", "coffee creamer",
      "tea", "green tea", "black tea", "herbal tea", "chamomile tea",
      "peppermint tea", "chai tea", "earl grey", "oolong tea",
      "tea bags", "loose leaf tea", "matcha"
    ]
  },
  {
    name: "Condiments & Sauces",
    order: 13,
    keywords: [
      "ketchup", "mustard", "yellow mustard", "dijon mustard",
      "mayonnaise", "mayo", "ranch dressing", "salad dressing",
      "italian dressing", "caesar dressing", "vinaigrette",
      "hot sauce", "tabasco", "sriracha", "frank's", "cholula",
      "soy sauce", "tamari", "worcestershire sauce",
      "vinegar", "apple cider vinegar", "white vinegar", "balsamic vinegar",
      "olive oil", "extra virgin olive oil", "vegetable oil", "canola oil",
      "coconut oil", "avocado oil", "sesame oil", "cooking spray",
      "teriyaki sauce", "bbq sauce", "barbecue sauce", "steak sauce",
      "relish", "tartar sauce", "cocktail sauce",
      "fish sauce", "oyster sauce", "hoisin sauce", "sweet chili sauce",
      "miso paste", "tahini", "pesto"
    ]
  },
  {
    name: "Baking & Spices",
    order: 14,
    keywords: [
      "flour", "all-purpose flour", "bread flour", "whole wheat flour",
      "almond flour", "sugar", "brown sugar", "powdered sugar",
      "confectioners sugar", "granulated sugar",
      "baking powder", "baking soda", "yeast", "active dry yeast",
      "vanilla extract", "almond extract", "cocoa powder",
      "chocolate chips", "baking chocolate", "sprinkles", "food coloring",
      "salt", "sea salt", "kosher salt", "black pepper", "white pepper",
      "cinnamon", "cumin", "paprika", "smoked paprika", "turmeric",
      "oregano", "thyme", "rosemary", "sage", "bay leaves",
      "chili powder", "cayenne pepper", "red pepper flakes",
      "garlic powder", "onion powder", "allspice", "nutmeg",
      "cloves", "cardamom", "coriander", "dill", "fennel seeds",
      "italian seasoning", "everything bagel seasoning",
      "spice", "spices", "seasoning", "herb mix", "dry rub",
      "cornstarch", "arrowroot", "gelatin", "pectin",
      "shortening", "lard", "vegetable shortening"
    ]
  },
  {
    name: "Wine, Beer & Spirits",
    order: 15,
    keywords: [
      "wine", "red wine", "white wine", "rosé", "rose wine",
      "champagne", "prosecco", "sparkling wine", "pinot grigio",
      "chardonnay", "sauvignon blanc", "cabernet", "merlot", "pinot noir",
      "beer", "ale", "lager", "ipa", "stout", "porter", "pilsner",
      "hard cider", "seltzer beer", "hard seltzer", "white claw",
      "vodka", "rum", "tequila", "gin", "whiskey", "bourbon",
      "scotch", "brandy", "cognac", "liqueur", "triple sec",
      "cocktail mixer", "margarita mix", "bloody mary mix"
    ]
  },
  {
    name: "Cleaning Supplies",
    order: 16,
    keywords: [
      "dish soap", "dish liquid", "dawn", "palmolive",
      "dishwasher detergent", "dishwasher pods", "cascade",
      "laundry detergent", "tide", "gain", "all detergent",
      "bleach", "clorox bleach", "fabric softener", "downy",
      "dryer sheets", "dryer balls",
      "all-purpose cleaner", "bathroom cleaner", "toilet cleaner",
      "toilet bowl cleaner", "glass cleaner", "windex",
      "furniture polish", "pledge", "lysol", "disinfectant",
      "sponge", "scrubber", "steel wool",
      "trash bags", "garbage bags", "lawn bags",
      "aluminum foil", "plastic wrap", "wax paper", "parchment paper",
      "ziploc bags", "storage bags", "sandwich bags", "freezer bags",
      "cleaning supplies", "mop", "broom", "dust pan"
    ]
  },
  {
    name: "Paper & Household",
    order: 17,
    keywords: [
      "paper towels", "paper towel", "bounty", "viva",
      "toilet paper", "toilet tissue", "charmin", "scott",
      "facial tissue", "kleenex", "puffs",
      "napkins", "paper napkins",
      "paper plates", "plastic plates", "foam plates",
      "cups", "paper cups", "plastic cups",
      "plastic utensils", "plastic silverware", "plastic forks",
      "light bulb", "light bulbs", "batteries", "battery",
      "candle", "candles", "matches", "lighter"
    ]
  },
  {
    name: "Personal Care",
    order: 18,
    keywords: [
      "shampoo", "conditioner", "hair conditioner", "dry shampoo",
      "body wash", "shower gel", "soap", "bar soap", "hand soap",
      "liquid hand soap", "lotion", "body lotion", "moisturizer",
      "sunscreen", "spf", "deodorant", "antiperspirant",
      "toothpaste", "toothbrush", "dental floss", "floss picks",
      "mouthwash", "listerine", "razor", "razors", "shaving cream",
      "shaving gel", "aftershave", "feminine care", "tampons",
      "pads", "panty liners", "lipstick", "lip balm", "chapstick",
      "makeup", "mascara", "foundation", "concealer", "blush",
      "eye shadow", "eyeliner", "nail polish", "perfume", "cologne",
      "face wash", "facial cleanser", "toner", "serum", "retinol",
      "cotton balls", "cotton swabs", "q-tips"
    ]
  },
  {
    name: "Baby & Pet",
    order: 19,
    keywords: [
      "baby food", "baby formula", "infant formula", "diaper", "diapers",
      "baby wipes", "diaper rash cream", "baby shampoo", "baby lotion",
      "dog food", "cat food", "wet food", "dry food", "kibble",
      "dog treats", "cat treats", "pet treats", "cat litter", "kitty litter",
      "pet food", "bird seed", "fish food", "hamster food",
      "flea treatment", "pet shampoo"
    ]
  },
  {
    name: "Pharmacy & Health",
    order: 20,
    keywords: [
      "vitamin", "vitamins", "multivitamin", "vitamin c", "vitamin d",
      "fish oil", "omega-3", "probiotics", "collagen", "supplement",
      "ibuprofen", "advil", "motrin", "tylenol", "acetaminophen",
      "aspirin", "naproxen", "aleve", "pain reliever",
      "antacid", "tums", "pepto", "pepcid", "prilosec",
      "allergy medicine", "claritin", "zyrtec", "benadryl",
      "cold medicine", "nyquil", "dayquil", "cough syrup", "cough drops",
      "bandage", "band-aid", "first aid", "neosporin", "hydrogen peroxide",
      "thermometer", "blood pressure"
    ]
  }
];

const DEFAULT_SECTION = { name: "Other", order: 99 };

// Build a flat map of { keyword, sectionName, regex } sorted by keyword length
// descending so that longer (more specific) keywords take precedence.
// Word-boundary matching prevents partial-word false positives (e.g. "ham" in "shampoo").
function _escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const _KEYWORD_MAP = [];
for (const section of SECTIONS) {
  for (const keyword of section.keywords) {
    _KEYWORD_MAP.push({
      keyword,
      sectionName: section.name,
      re: new RegExp("\\b" + _escapeRegex(keyword) + "\\b", "i")
    });
  }
}
_KEYWORD_MAP.sort((a, b) => b.keyword.length - a.keyword.length);

/**
 * Categorize a single grocery item into a Publix store section.
 * Uses longest-match-wins with word-boundary matching (case-insensitive).
 * @param {string} itemName
 * @returns {string} section name
 */
function categorizeItem(itemName) {
  for (const entry of _KEYWORD_MAP) {
    if (entry.re.test(itemName)) {
      return entry.sectionName;
    }
  }
  return DEFAULT_SECTION.name;
}

/**
 * Group an array of item names by Publix store section, sorted in store walk order.
 * Items within each section are sorted alphabetically.
 * @param {string[]} items
 * @returns {Array<{section: string, items: string[]}>}
 */
function groupByAisle(items) {
  const groups = {};
  for (const item of items) {
    const section = categorizeItem(item);
    if (!groups[section]) groups[section] = [];
    groups[section].push(item);
  }

  // Build section order lookup
  const sectionOrder = {};
  for (const s of SECTIONS) sectionOrder[s.name] = s.order;
  sectionOrder[DEFAULT_SECTION.name] = DEFAULT_SECTION.order;

  return Object.keys(groups)
    .sort((a, b) => (sectionOrder[a] || 99) - (sectionOrder[b] || 99))
    .map(name => ({ section: name, items: groups[name].slice().sort() }));
}

module.exports = { categorizeItem, groupByAisle, SECTIONS, DEFAULT_SECTION };
