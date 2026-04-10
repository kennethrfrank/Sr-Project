export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  topic: string;
  difficulty: "beginner" | "intermediate" | "advanced";
};

const fallbackBank: QuizQuestion[] = [
  {
    id: "phish-1",
    topic: "Phishing",
    difficulty: "beginner",
    question: "Which sign most strongly suggests an email may be a phishing attempt?",
    options: [
      "It uses a company logo",
      "It creates urgency and asks you to click a link right away",
      "It has a signature line",
      "It was sent on a weekday",
    ],
    answer: "It creates urgency and asks you to click a link right away",
    explanation:
      "Phishing messages often pressure the user into acting fast before they stop and verify the sender, link, or request.",
  },
  {
    id: "phish-2",
    topic: "Phishing",
    difficulty: "intermediate",
    question: "What is the safest next step after receiving a suspicious password reset email?",
    options: [
      "Click the email link and change it immediately",
      "Reply and ask whether it is real",
      "Go directly to the official website or app instead of using the email link",
      "Forward it to a friend first",
    ],
    answer: "Go directly to the official website or app instead of using the email link",
    explanation:
      "Using the official site avoids fake links and lets the user verify whether any account action is actually needed.",
  },
  {
    id: "password-1",
    topic: "Password Safety",
    difficulty: "beginner",
    question: "Which password habit is strongest from a security standpoint?",
    options: [
      "Using one memorable password everywhere",
      "Changing only one character for each website",
      "Using a long unique password for every account with a password manager",
      "Writing every password in an unlocked notes app",
    ],
    answer: "Using a long unique password for every account with a password manager",
    explanation:
      "Unique passwords reduce chain-reaction breaches, and a manager makes strong passwords realistic to maintain.",
  },
  {
    id: "password-2",
    topic: "Password Safety",
    difficulty: "intermediate",
    question: "Why is multi-factor authentication important even when a password is strong?",
    options: [
      "It makes the website load faster",
      "It adds another barrier if the password is stolen or guessed",
      "It replaces the need for passwords forever",
      "It hides your username from attackers",
    ],
    answer: "It adds another barrier if the password is stolen or guessed",
    explanation:
      "MFA helps protect an account even after password compromise by requiring another proof of identity.",
  },
  {
    id: "privacy-1",
    topic: "Privacy & Data Protection",
    difficulty: "beginner",
    question: "Which action best helps protect personal information on public Wi-Fi?",
    options: [
      "Logging into every account as quickly as possible",
      "Turning off device updates forever",
      "Avoiding sensitive logins unless using a trusted secure connection",
      "Sharing your hotspot password with strangers",
    ],
    answer: "Avoiding sensitive logins unless using a trusted secure connection",
    explanation:
      "Public networks increase risk, so sensitive activity should be limited unless the connection is trusted and protected.",
  },
  {
    id: "privacy-2",
    topic: "Privacy & Data Protection",
    difficulty: "advanced",
    question: "Which principle most directly supports data minimization?",
    options: [
      "Collect only the information that is necessary for the task",
      "Store all data forever in case it becomes useful",
      "Share user data widely across internal teams",
      "Disable access logs to reduce storage",
    ],
    answer: "Collect only the information that is necessary for the task",
    explanation:
      "Data minimization means limiting collection and retention to what is truly needed, which lowers exposure and privacy risk.",
  },
  {
    id: "incident-1",
    topic: "Incident Response",
    difficulty: "intermediate",
    question: "After clicking a suspicious link on a work device, what should happen first?",
    options: [
      "Ignore it if nothing popped up",
      "Report it quickly according to the organization's incident process",
      "Delete your browser history and say nothing",
      "Post about it on social media",
    ],
    answer: "Report it quickly according to the organization's incident process",
    explanation:
      "Fast reporting helps contain the issue before it spreads, and it gives security teams a chance to investigate and respond.",
  },
  {
    id: "social-1",
    topic: "Social Engineering",
    difficulty: "advanced",
    question: "A caller claims to be IT and asks for your verification code to 'fix' your account. What is the best response?",
    options: [
      "Give the code if they already know your name",
      "Share only the first half of the code",
      "Refuse and verify through an official support channel",
      "Text the code instead of saying it aloud",
    ],
    answer: "Refuse and verify through an official support channel",
    explanation:
      "Verification codes should never be shared on demand. Real support teams can be verified through official channels.",
  },
];

export function buildFallbackQuiz(topic: string, difficulty: QuizQuestion["difficulty"], count: number) {
  const normalizedTopic = topic.trim().toLowerCase();
  const topicMatches = fallbackBank.filter(
    (question) =>
      question.topic.toLowerCase() === normalizedTopic || normalizedTopic === "general cybersecurity"
  );

  const difficultyMatches = topicMatches.filter((question) => question.difficulty === difficulty);
  const chosenPool = difficultyMatches.length >= count ? difficultyMatches : topicMatches;
  const selected = chosenPool.slice(0, count);

  if (selected.length >= count) return selected;

  const remaining = fallbackBank.filter((item) => !selected.some((picked) => picked.id === item.id));
  return [...selected, ...remaining.slice(0, Math.max(0, count - selected.length))];
}
