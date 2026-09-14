import type { DifficultyLevel } from '../types/race';

export interface Passage {
  id: string;
  title: string;
  author: string;
  difficulty: DifficultyLevel;
  text: string;
}

export const PASSAGES: Passage[] = [
  // --- EASY PASSAGES (Straightforward vocabulary, clear sentence structure, standard punctuation) ---
  {
    id: 'easy-1',
    title: 'The Art of Typing',
    author: 'Typothon Chronicles',
    difficulty: 'easy',
    text: 'Typing with speed and accuracy is very much like playing a musical instrument. Your fingers learn to glide across the keyboard with ease, finding every key without needing to glance down. As you practice each day, your mind begins to think directly in whole words and complete thoughts rather than single letters. Consistency will always beat frantic rushing.',
  },
  {
    id: 'easy-2',
    title: 'A Quiet Morning',
    author: 'Sunrise Tales',
    difficulty: 'easy',
    text: 'The morning sun rose gently over the sleeping valley, painting the clouds in warm shades of gold and amber. Down along the quiet streets, a few early walkers strolled with warm coffee in hand as the cool breeze rustled through the trees. Every new sunrise offers a fresh chance to learn something new and make the world a little brighter.',
  },
  {
    id: 'easy-3',
    title: 'Coding Your First Game',
    author: 'Pixel Dreams',
    difficulty: 'easy',
    text: 'Building your very first video game is one of the most exciting projects you can start. You begin with a blank screen, write a simple loop to draw a small character, and add rules to make it jump when you press the spacebar. Watching your ideas come to life on the monitor brings an incredible feeling of joy and creative pride.',
  },
  {
    id: 'easy-4',
    title: 'The Blue Planet',
    author: 'Cosmic Journey',
    difficulty: 'easy',
    text: 'When astronauts look down at Earth from orbit, they often describe feeling a deep sense of wonder. High above the atmosphere, our planet looks like a fragile blue marble resting in the silent dark sea of space. From that distance, there are no borders or walls between nations, only one shared home that we must protect together.',
  },
  {
    id: 'easy-5',
    title: 'The Secret Garden',
    author: 'Green Canopy',
    difficulty: 'easy',
    text: 'Behind the old stone library was a hidden courtyard filled with blooming lavender and tall sunflowers. Honeybees danced from blossom to blossom under the warm afternoon sun while a small water fountain bubbled happily in the center. It was the perfect peaceful refuge to sit down, read a favorite book, and forget about the busy day.',
  },

  // --- MEDIUM PASSAGES (Rich vocabulary, contractions, compound sentences, cyberpunk/tech themes) ---
  {
    id: 'med-1',
    title: 'Neon Skyline',
    author: 'Cyberpunk Archives',
    difficulty: 'medium',
    text: 'Rain cascaded down the towering spires of Neo-Veridia, reflecting the brilliant pink and cyan glare of holographic advertisements. High-speed maglev trains sliced through the dense smog above, while street-level markets buzzed with rogue technicians exchanging encrypted flash drives in secluded alleyways. In this metropolis, information was the only currency that truly mattered.',
  },
  {
    id: 'med-2',
    title: 'The Silicon Revolution',
    author: 'Computing History',
    difficulty: 'medium',
    text: 'The evolution of modern computing didn’t happen overnight; it was forged through decades of relentless ingenuity and daring curiosity. From punch cards and vacuum tubes to silicon microprocessors and distributed networks, each generation of inventors stood upon the shoulders of giants to unlock computational speeds that were once dismissed as impossible fantasy.',
  },
  {
    id: 'med-3',
    title: 'Subsea Data Arteries',
    author: 'Global Mesh Report',
    difficulty: 'medium',
    text: 'Beneath the turbulent surface of the Atlantic, thousands of miles of fiber-optic cables lie silently along the ocean floor. Billions of encrypted packets traverse these glass strands every second, synchronizing global ledgers, training neural networks, and connecting voices across oceans before you can blink your eyes. Our physical world is bound together by light.',
  },
  {
    id: 'med-4',
    title: 'Midnight Overclock',
    author: 'Hardware Underground',
    difficulty: 'medium',
    text: 'Late at night, when the neighborhood had surrendered to quiet slumber, the mechanical switches clacked with steady rhythmic precision. Coolant flowed silently through transparent tubes, bathing the exposed motherboard in an electric ultraviolet glow. A solitary developer leaned forward, determined to eradicate a elusive race condition before the clock struck three.',
  },
  {
    id: 'med-5',
    title: 'Reflections on AI',
    author: 'Digital Philosophy',
    difficulty: 'medium',
    text: 'Artificial intelligence is neither an existential monster nor an all-powerful savior; it is a mirror that reflects the depths of human knowledge, curiosity, and flaws. As algorithms learn to synthesize expressive artwork, compose melodies, and diagnose illnesses, they challenge us to reflect deeply on what makes human intuition and empathy irreplaceable.',
  },

  // --- HARD PASSAGES (Advanced technical & literary vocabulary, complex syntax, numbers, punctuation) ---
  {
    id: 'hard-1',
    title: 'Distributed Consensus Mechanics',
    author: 'Systems Architecture',
    difficulty: 'hard',
    text: 'Architecting Byzantine fault-tolerant consensus mechanisms requires reconciling safety, liveness, and latency within distributed topologies. When adversarial nodes broadcast conflicting state transitions across asynchronous channels, quorum-based protocols—such as Paxos, Raft, and PBFT—must guarantee deterministic state machine replication without introducing single points of architectural failure.',
  },
  {
    id: 'hard-2',
    title: 'Quantum Decoherence Dynamics',
    author: 'Theoretical Physics Journal',
    difficulty: 'hard',
    text: 'Quantum decoherence represents the definitive bottleneck in scaling superconducting transmon qubit processors: as environmental thermodynamic noise induces irreversible phase collapses, quantum superposition decays exponentially into classical probability. Mitigating this entropy necessitates topological surface codes, dilution cryostats operating at 15 millikelvin, and real-time syndrome extraction.',
  },
  {
    id: 'hard-3',
    title: 'Information Entropy Foundations',
    author: 'Bell Labs Monograph, 1948',
    difficulty: 'hard',
    text: 'In his landmark treatise, Claude E. Shannon formulated that information entropy—expressed as H(X) = -sum(p(x) * log2(p(x)))—establishes the absolute theoretical limit for lossless data compression. By decoupling semantic meaning from statistical symbol probability, Shannon constructed the mathematical bedrock upon which all modern telecommunications, encryption, and streaming protocols operate.',
  },
  {
    id: 'hard-4',
    title: 'High-Frequency Execution Pipelines',
    author: 'Algorithmic Microstructures',
    difficulty: 'hard',
    text: 'High-frequency algorithmic architectures utilize field-programmable gate arrays (FPGAs), kernel-bypass networking, and PCIe Gen5 direct memory access (DMA) to execute limit-order book arbitrage within sub-300-nanosecond windows. In this domain, nanosecond propagation delays across dispersion-compensated fiber-optic links dictate multimillion-dollar liquidity yields.',
  },
  {
    id: 'hard-5',
    title: 'Neuromorphic Silicon Topology',
    author: 'Computational Neuroscience',
    difficulty: 'hard',
    text: 'The human cerebral cortex comprises approximately 8.6 x 10^10 neurons interconnected by roughly 100 trillion synaptic junctions. Translating this biological plasticity into neuromorphic silicon—wherein event-driven memristive crossbar arrays emulate continuous bioelectric action potentials—constitutes one of the most audacious, interdisciplinary frontiers in machine intelligence.',
  }
];

export function getPassagesByDifficulty(difficulty: DifficultyLevel): Passage[] {
  return PASSAGES.filter(p => p.difficulty === difficulty);
}

export function getRandomPassage(difficulty: DifficultyLevel): Passage {
  const filtered = getPassagesByDifficulty(difficulty);
  if (filtered.length === 0) return PASSAGES[0];
  return filtered[Math.floor(Math.random() * filtered.length)];
}
