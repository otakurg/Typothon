import type { RaceMode } from '../types/race';

export const COMMON_WORDS = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "it",
  "for", "not", "on", "with", "as", "you", "do", "at", "this", "but",
  "his", "by", "from", "they", "we", "say", "her", "she", "or", "an",
  "will", "my", "one", "all", "would", "there", "their", "what", "so", "up",
  "out", "if", "about", "who", "get", "which", "go", "me", "when", "make",
  "can", "like", "time", "no", "just", "him", "know", "take", "people", "into",
  "year", "your", "good", "some", "could", "them", "see", "other", "than", "then",
  "now", "look", "only", "come", "its", "over", "think", "also", "back", "after",
  "use", "two", "how", "our", "work", "first", "well", "way", "even", "new",
  "want", "because", "any", "these", "give", "day", "most", "us", "system", "code",
  "cyber", "data", "matrix", "network", "node", "pulse", "stream", "packet", "signal", "vector",
  "protocol", "terminal", "memory", "virtual", "quantum", "kernel", "thread", "cipher", "neural", "latency",
  "bypass", "overclock", "firewall", "binary", "switch", "digital", "router", "buffer", "cache", "stack"
];

export const CYBER_QUOTES = [
  {
    quote: "The sky above the port was the color of television, tuned to a dead channel.",
    source: "William Gibson, Neuromancer"
  },
  {
    quote: "There is no spoon. It is not the spoon that bends, it is only yourself.",
    source: "The Matrix"
  },
  {
    quote: "All those moments will be lost in time, like tears in rain. Time to die.",
    source: "Roy Batty, Blade Runner"
  },
  {
    quote: "Talk is cheap. Show me the code. Given enough eyeballs, all bugs are shallow.",
    source: "Linus Torvalds"
  },
  {
    quote: "Cyberspace. A consensual hallucination experienced daily by billions of legitimate operators.",
    source: "William Gibson, Neuromancer"
  },
  {
    quote: "We can only see a short distance ahead, but we can see plenty there that needs to be done.",
    source: "Alan Turing"
  },
  {
    quote: "Wake the fuck up, Samurai. We have a city to burn.",
    source: "Johnny Silverhand, Cyberpunk 2077"
  },
  {
    quote: "The deliverator belongs to an elite order, a member of a subculture where speed is absolute currency.",
    source: "Neal Stephenson, Snow Crash"
  }
];

export function generateRaceText(mode: RaceMode): { text: string; source?: string } {
  if (mode.type === 'quote') {
    const item = CYBER_QUOTES[Math.floor(Math.random() * CYBER_QUOTES.length)];
    return { text: item.quote, source: item.source };
  }

  const wordCount = mode.type === 'words' ? mode.count : (mode.duration === 15 ? 40 : mode.duration === 30 ? 75 : 130);
  
  const selected: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    const randomIndex = Math.floor(Math.random() * COMMON_WORDS.length);
    selected.push(COMMON_WORDS[randomIndex]);
  }
  return { text: selected.join(' ') };
}
