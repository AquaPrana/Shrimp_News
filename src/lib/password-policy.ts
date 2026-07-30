export type PasswordStrength = {
  score: number;
  label: "Very weak" | "Weak" | "Fair" | "Good" | "Strong";
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
};

export function passwordStrength(password: string): PasswordStrength {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const labels = ["Very weak", "Very weak", "Weak", "Fair", "Good", "Strong"] as const;
  return { score, label: labels[score], checks };
}

export function validatePassword(password: string) {
  const strength = passwordStrength(password);
  if (!strength.checks.length) return "Password must be at least 8 characters.";
  if (!strength.checks.uppercase) return "Password must include an uppercase letter.";
  if (!strength.checks.lowercase) return "Password must include a lowercase letter.";
  if (!strength.checks.number) return "Password must include a number.";
  if (!strength.checks.special) return "Password must include a special character.";
  if (password.length > 200) return "Password is too long.";
  return null;
}
