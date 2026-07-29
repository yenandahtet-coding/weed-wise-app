export function getFirebaseErrorMessage(error: any): string {
  const code = error?.code || "";
  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address format.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/too-many-requests':
      return 'Too many login attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/email-already-in-use':
      return 'Email is already registered.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use a stronger password (min 6 characters).';
    default:
      if (error?.message) return error.message;
      return 'An unexpected error occurred. Please try again.';
  }
}
