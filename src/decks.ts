import type { Deck } from './types';

export const DEFAULT_DECKS: Deck[] = [
  {
    id: 'movies-tv',
    title: 'Blockbuster Movies & Series',
    description: 'Iconic movies, beloved TV shows, and streaming hits!',
    icon: '🎬',
    color: 'from-amber-500 to-rose-600',
    category: 'Entertainment',
    cards: [
      'Harry Potter',
      'Titanic',
      'Stranger Things',
      'The Avengers',
      'Jurassic Park',
      'Breaking Bad',
      'The Lion King',
      'Inception',
      'Spider-Man',
      'Game of Thrones',
      'Shrek',
      'Star Wars',
      'Frozen',
      'The Matrix',
      'Wednesday',
      'Barbie',
      'Oppenheimer',
      'Home Alone',
      'Avatar',
      'Pirates of the Caribbean',
      'Squid Game',
      'The Dark Knight',
      'Finding Nemo',
      'The Hunger Games',
      'Friends',
      'Interstellar',
      'The Lord of the Rings',
      'The Godfather',
      'Top Gun: Maverick',
      'Squid Game',
      'The Office',
      'Back to the Future',
      'Gladiator',
      'Ghostbusters',
      'The Shawshank Redemption',
      'Iron Man',
      'Money Heist',
      'Black Panther',
      'Pulp Fiction',
      'Forrest Gump'
    ]
  },
  {
    id: 'act-it-out',
    title: 'Act It Out (Charades)',
    description: 'No talking allowed! Act out funny actions and scenarios.',
    icon: '🎭',
    color: 'from-purple-500 to-indigo-600',
    category: 'Party',
    cards: [
      'Brushing your teeth',
      'Walking a tightrope',
      'Opening a champagne bottle',
      'Stuck in heavy traffic',
      'Surfing a huge wave',
      'Walking on the Moon',
      'Riding a crazy rollercoaster',
      'Sneezing while hiding',
      'Baking a giant pizza',
      'Eating extremely spicy chili',
      'Milking a cow',
      'Playing electric guitar',
      'Building IKEA furniture',
      'Skiing down a steep mountain',
      'Getting caught in torrential rain',
      'Taking a flattering selfie',
      'Reeling in a giant fish',
      'Running away from a bee',
      'Singing loudly in the shower',
      'Zombie walking',
      'Juggling flaming torches',
      'Sumo wrestling match',
      'Changing a baby diaper',
      'Walking against strong wind',
      'Dancing ballet',
      'Winning the lottery jackpot',
      'Stealing a cookie from a jar',
      'Karate kicking',
      'Escaping quicksand',
      'Conducting an orchestra'
    ]
  },
  {
    id: 'animals-nature',
    title: 'Animals & Wildlife',
    description: 'From deep sea creatures to jungle predators.',
    icon: '🦁',
    color: 'from-emerald-500 to-teal-700',
    category: 'Nature',
    cards: [
      'Lion',
      'Kangaroo',
      'Penguin',
      'African Elephant',
      'Chimpanzee',
      'Bottlenose Dolphin',
      'Giraffe',
      'Sloth',
      'Flamingo',
      'Giant Octopus',
      'Cheetah',
      'Giant Panda',
      'Koala',
      'Peacock',
      'Crocodile',
      'Silverback Gorilla',
      'Zebra',
      'Great Horned Owl',
      'Chameleon',
      'Seahorse',
      'Polar Bear',
      'Platypus',
      'Hedgehog',
      'Hammerhead Shark',
      'Bald Eagle',
      'Llama',
      'Walrus',
      'Meerkat',
      'Wolf',
      'Hippopotamus',
      'Komodo Dragon',
      'Hummingbird',
      'Beaver',
      'Grizzly Bear',
      'Ostrich'
    ]
  },
  {
    id: 'celebrities-icons',
    title: 'Celebrities & Superstars',
    description: 'A-list actors, pop stars, athletes, and legendary icons.',
    icon: '🌟',
    color: 'from-pink-500 to-rose-500',
    category: 'Pop Culture',
    cards: [
      'Taylor Swift',
      'Cristiano Ronaldo',
      'Beyoncé',
      'Lionel Messi',
      'Tom Cruise',
      'Billie Eilish',
      'Dwayne "The Rock" Johnson',
      'Elon Musk',
      'Rihanna',
      'Leonardo DiCaprio',
      'Selena Gomez',
      'Keanu Reeves',
      'Zendaya',
      'Michael Jackson',
      'Shakira',
      'Will Smith',
      'Ariana Grande',
      'Brad Pitt',
      'Lady Gaga',
      'Gordon Ramsay',
      'Oprah Winfrey',
      'MrBeast',
      'Ed Sheeran',
      'Scarlett Johansson',
      'Adele',
      'Morgan Freeman',
      'Katy Perry',
      'Justin Bieber',
      'Emma Watson',
      'Post Malone'
    ]
  },
  {
    id: 'food-drinks',
    title: 'Food, Snacks & Drinks',
    description: 'Mouth-watering dishes, street food, and beverages.',
    icon: '🍕',
    color: 'from-orange-500 to-amber-600',
    category: 'Lifestyle',
    cards: [
      'Pizza Margherita',
      'Sushi & Sashimi',
      'Chocolate Ice Cream',
      'Crispy Tacos',
      'French Fries',
      'Pancakes with Maple Syrup',
      'Boba Bubble Tea',
      'Double Cheeseburger',
      'Hot Espresso',
      'Spaghetti Bolognese',
      'Guacamole and Tortilla Chips',
      'Fluffy Cotton Candy',
      'Butter Croissant',
      'Japanese Ramen',
      'Chicago Hot Dog',
      'Sweet Watermelon',
      'Spicy Burrito',
      'Glazed Donuts',
      'Avocado Toast',
      'Barbecue Ribs',
      'Buttery Popcorn',
      'Cinnamon Churros',
      'Belgian Waffles',
      'Chicken Nuggets',
      'Lasagna',
      'Fish and Chips',
      'Chocolate Milkshake',
      'Pad Thai',
      'Fresh Dim Sum',
      'Fondue'
    ]
  },
  {
    id: 'retro-nostalgia',
    title: '90s & 2000s Nostalgia',
    description: 'Gadgets, trends, and toys from the golden era.',
    icon: '📼',
    color: 'from-fuchsia-500 to-cyan-500',
    category: 'Retro',
    cards: [
      'Sony Walkman cassette player',
      'Tamagotchi virtual pet',
      'Blockbuster Video store',
      'Dial-up Internet screech',
      'Floppy Disk 3.5 inch',
      'Game Boy Color',
      'MSN Messenger',
      'Nintendo 64 controller',
      'Apple iPod with Click Wheel',
      'MySpace Top 8',
      'VHS Tape rewinder',
      'Nokia 3310 (Snake game)',
      'Frosted Hair Tips',
      'Rollerblades',
      'Pokemon Trading Cards',
      'Heelys skate shoes',
      'Britney Spears',
      'Spice Girls',
      'Beanie Babies collection',
      'Limewire & Napster',
      'Y2K Bug scare',
      'CD Discman',
      'Slap Bracelets',
      'Furby toy',
      'Pagers / Beeper'
    ]
  },
  {
    id: 'gaming-legends',
    title: 'Video Games & Characters',
    description: 'Legendary games, gaming heroes, and modern esports.',
    icon: '🎮',
    color: 'from-violet-600 to-blue-600',
    category: 'Gaming',
    cards: [
      'Minecraft (Creeper)',
      'Super Mario Bros',
      'Fortnite Battle Royale',
      'Grand Theft Auto',
      'Pikachu (Pokemon)',
      'The Legend of Zelda (Link)',
      'Roblox',
      'Call of Duty',
      'Pac-Man',
      'Sonic the Hedgehog',
      'Among Us (Impostor)',
      'Tetris',
      'League of Legends',
      'Overwatch',
      'Elden Ring',
      'Angry Birds',
      'Cyberpunk 2077',
      'Street Fighter',
      'Halo (Master Chief)',
      'Clash of Clans',
      'God of War (Kratos)',
      'Portal (Aperture Science)',
      'Apex Legends',
      'Counter-Strike',
      'Fall Guys',
      'The Sims'
    ]
  },
  {
    id: 'world-wonders',
    title: 'World Travel & Landmarks',
    description: 'Famous monuments, natural wonders, and great cities.',
    icon: '🌍',
    color: 'from-blue-500 to-teal-600',
    category: 'Travel',
    cards: [
      'Eiffel Tower (Paris)',
      'Statue of Liberty (New York)',
      'Great Wall of China',
      'Taj Mahal (India)',
      'Great Pyramids of Giza',
      'Colosseum (Rome)',
      'Big Ben (London)',
      'Mount Everest',
      'Sydney Opera House',
      'Grand Canyon (Arizona)',
      'Machu Picchu (Peru)',
      'Tower Bridge (London)',
      'Niagara Falls',
      'Mount Fuji (Japan)',
      'Golden Gate Bridge (San Francisco)',
      'Venice Gondola Canals',
      'Times Square (New York)',
      'Burj Khalifa (Dubai)',
      'Christ the Redeemer (Rio)',
      'Stonehenge (England)',
      'Leaning Tower of Pisa',
      'Santorini (Greece)',
      'Hollywood Sign (Los Angeles)',
      'Petra (Jordan)',
      'Louvre Glass Pyramid'
    ]
  },
  {
    id: 'kids-cartoons',
    title: 'Kids Fun & Cartoons',
    description: 'Colorful animations, friendly characters, and fairy tales.',
    icon: '🎈',
    color: 'from-yellow-400 to-rose-500',
    category: 'Kids & Family',
    cards: [
      'SpongeBob SquarePants',
      'Mickey Mouse',
      'Peppa Pig',
      'Scooby-Doo',
      'Tom and Jerry',
      'Elsa (Frozen)',
      'Minions',
      'Simba (Lion King)',
      'Bugs Bunny',
      'Winnie the Pooh',
      'Buzz Lightyear (Toy Story)',
      'Paw Patrol Chase',
      'Dora the Explorer',
      'Garfield the Cat',
      'Kung Fu Panda (Po)',
      'Cinderella',
      'Curious George',
      'Sonic the Hedgehog',
      'Lightning McQueen (Cars)',
      'Patrick Star',
      'The Flintstones',
      'Donald Duck',
      'Clifford the Big Red Dog',
      'Pinocchio',
      'Peter Pan'
    ]
  }
];

const STORAGE_KEY = 'guess_up_custom_decks_v1';
const DELETED_DEFAULT_IDS_KEY = 'guess_up_deleted_defaults_v1';

/**
 * Load all decks from LocalStorage or fallback to default decks
 */
export function getStoredDecks(): Deck[] {
  try {
    const customData = localStorage.getItem(STORAGE_KEY);
    const deletedDefaultsData = localStorage.getItem(DELETED_DEFAULT_IDS_KEY);
    const deletedDefaultIds: string[] = deletedDefaultsData ? JSON.parse(deletedDefaultsData) : [];

    // Filter defaults if user explicitly deleted any
    const activeDefaults = DEFAULT_DECKS.filter(d => !deletedDefaultIds.includes(d.id));

    if (!customData) {
      return activeDefaults;
    }

    const parsed: Deck[] = JSON.parse(customData);
    if (!Array.isArray(parsed)) return activeDefaults;

    // Merge: custom decks first, then any defaults not present in parsed
    return parsed;
  } catch (error) {
    console.error('Failed to load decks from storage, using defaults:', error);
    return DEFAULT_DECKS;
  }
}

/**
 * Save current deck collection to LocalStorage
 */
export function saveDecksToStorage(decks: Deck[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
  } catch (error) {
    console.error('Failed to save decks to storage:', error);
  }
}

/**
 * Add or update a single custom deck
 */
export function saveOrUpdateDeck(deck: Deck): Deck[] {
  const currentDecks = getStoredDecks();
  const index = currentDecks.findIndex(d => d.id === deck.id);

  let updated: Deck[];
  if (index >= 0) {
    updated = [...currentDecks];
    updated[index] = deck;
  } else {
    updated = [deck, ...currentDecks];
  }

  saveDecksToStorage(updated);
  return updated;
}

/**
 * Delete a deck by ID
 */
export function deleteDeckById(id: string): Deck[] {
  const currentDecks = getStoredDecks();
  const updated = currentDecks.filter(d => d.id !== id);

  // If this was a default deck, mark it as deleted so it won't reappear on reload
  const isDefault = DEFAULT_DECKS.some(d => d.id === id);
  if (isDefault) {
    try {
      const deletedData = localStorage.getItem(DELETED_DEFAULT_IDS_KEY);
      const list: string[] = deletedData ? JSON.parse(deletedData) : [];
      if (!list.includes(id)) {
        list.push(id);
        localStorage.setItem(DELETED_DEFAULT_IDS_KEY, JSON.stringify(list));
      }
    } catch {
      // ignore
    }
  }

  saveDecksToStorage(updated);
  return updated;
}

/**
 * Reset all decks to factory default collection
 */
export function resetToFactoryDefaults(): Deck[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DELETED_DEFAULT_IDS_KEY);
  } catch {
    // ignore
  }
  return DEFAULT_DECKS;
}

/**
 * Export all decks as formatted JSON string
 */
export function exportDecksAsJSON(decks: Deck[]): string {
  return JSON.stringify(decks, null, 2);
}

/**
 * Import and validate JSON deck list
 */
export function importDecksFromJSON(jsonString: string): { success: boolean; decks?: Deck[]; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) {
      return { success: false, error: 'JSON root must be an array of Deck objects.' };
    }

    // Validate structure of each item
    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i];
      if (!item.id || typeof item.id !== 'string') {
        return { success: false, error: `Deck at index ${i} is missing a valid 'id' string.` };
      }
      if (!item.title || typeof item.title !== 'string') {
        return { success: false, error: `Deck "${item.id}" is missing a valid 'title' string.` };
      }
      if (!Array.isArray(item.cards) || item.cards.length === 0) {
        return { success: false, error: `Deck "${item.title}" must have a non-empty 'cards' array.` };
      }
    }

    saveDecksToStorage(parsed);
    return { success: true, decks: parsed };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Invalid JSON format' };
  }
}
