export type FeedItem = {
  type: string;
  timestamp: string | null;
  message: string;
  user?: {
    id: number;
    full_name: string | null;
  } | null;
  payload?: Record<string, unknown>;
};

export type PublicUserSearchOut = {
  user_id: number;
  full_name: string;
  headline?: string | null;
  achievement_total: number;
  recommendation_total: number;
  caret_score?: number;
  username?: string;
  profile_photo_url?: string | null;
  verified_education?: VerifiedEducation[];
  verified_work?: VerifiedWork[];
};

export type RecommenderMini = {
  full_name: string;
  username: string;
};

export type VerifiedEducation = {
  university_name: string;
  degree_type: string;
};

export type VerifiedWork = {
  company_name: string;
  title: string;
};

export type PublicUserOut = {
  id: number;
  full_name: string;
  username: string;
  recommended_by: RecommenderMini[];
  recommender_count: number;
  profile_photo_url?: string | null;
  achievement_total?: number;
  recommendation_total?: number;
  caret_score?: number;
  verified_education?: VerifiedEducation[];
  verified_work?: VerifiedWork[];
};

export type LeaderboardRow = {
  rank: number;
  score: number;
  user: {
    id: number;
    full_name: string;
    username?: string;
  };
};

export type CombinedLeaderboardRow = {
  rank: number;
  combined_score: number;
  achievement_score: number;
  recommendation_score: number;
  pA: number;
  pR: number;
  user: {
    id: number;
    full_name: string;
    username?: string;
  };
};

export type PendingRecommendation = {
  id: number;
  rec_type: string;
  reason: string;
  status: string;
  created_at: string;
  requester: {
    id: number;
    full_name: string;
    username: string;
  } | null;
};

export type UserProfile = {
  id: number;
  user_id: number;
  username?: string;
  email?: string;
  full_name?: string;
  profile_photo_url?: string | null;
  headline?: string | null;
  about?: string | null;
  location?: string | null;
  pronouns?: string | null;
  website_url?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
  twitter_url?: string | null;
  interests?: unknown[] | null;
  favorite_movie_character?: string | null;
  favorite_quote?: string | null;
  current_project?: string | null;
  current_goal?: string | null;
  open_to_roles?: unknown[] | null;
  university_names?: unknown[] | null;
  current_semester?: string | null;
  current_courses?: unknown[] | null;
  clubs?: unknown[] | null;
  top_skills?: unknown[] | null;
  tools_stack?: unknown[] | null;
  is_open_to_recommendations?: boolean | null;
  is_hiring?: boolean | null;
  favorite_books?: unknown[] | null;
  achievements_highlight?: unknown[] | null;
  visibility: "PUBLIC" | "ONLY_CONNECTIONS" | "PRIVATE";
};

export type ScoreOut = {
  user_id: number;
  achievement_score?: number;
  recommendation_score?: number;
};

export type CaretScoreOut = {
  user_id: number;
  caret_score: number;
};

export type CaretNotification = {
  id: number;
  post_id: number;
  post_type: string;
  post_content: string;
  caret_count: number;
  created_at: string;
  giver: {
    id: number;
    username: string;
    full_name: string;
    profile_photo_url?: string | null;
  };
};

export type WorkCreate = {
  company_name: string;
  title: string;
  employment_type: string;
  is_current: boolean;
  start_date: string;
  end_date?: string | null;
  supervisor_name: string;
  supervisor_email: string;
  supervisor_phone?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
};

export type WorkOut = {
  id: number;
  user_id: number;
  company_name: string;
  title: string;
  employment_type: string;
  is_current: boolean;
  start_date: string;
  end_date?: string | null;
  verification_status: string;
  verified_at?: string | null;
};

export type WorkScoreOut = {
  work_id: number;
  user_id: number;
  company_name: string;
  title: string;
  employment_type: string;
  start_date: string;
  end_date?: string | null;
  is_current: boolean;
  total: number;
  breakdown: {
    base: number;
    months: number;
    duration_bonus: number;
  };
};

export type EducationCreate = {
  degree_type: string;
  college_id: string;
  gpa: number;
  start_date?: string | null;
  end_date?: string | null;
  is_completed: boolean;
  advisor_name: string;
  advisor_email: string;
  advisor_phone?: string | null;
};

export type EducationOut = {
  id: number;
  user_id: number;
  degree_type: string;
  college_id: string;
  university_name: string;
  university_tier: number;
  gpa?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  is_completed: boolean;
  verification_status: string;
  verified_at?: string | null;
};

export type EducationScoreOut = {
  education_id: number;
  user_id: number;
  degree_type: string;
  college_id: string;
  university_name: string;
  university_tier: number;
  gpa?: number | null;
  total: number;
  breakdown: {
    base: number;
    completion_bonus: number;
    gpa_bonus: number;
    tier_bonus: number;
  };
};

export type AdminVerification = {
  id: number;
  owner_user_id: number;
  subject_type: string;
  subject_id: number;
  status: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string | null;
  created_at: string;
  decided_at?: string | null;
  decided_by_user_id?: number | null;
  admin_notes?: string | null;
};

export type ReflectionType =
  | "story";

export type ReflectionUser = {
  id: number;
  username: string;
  full_name: string;
  university?: string | null;
};

export type ReflectionOut = {
  id: number;
  type: ReflectionType;
  content: string;
  created_at: string;
  user: ReflectionUser;
};

export type PostType =
  | "behind_resume"
  | "this_lately"
  | "recent_realization"
  | "currently_building";

export type PostUser = {
  id: number;
  username: string;
  full_name: string;
  university?: string | null;
  profile_photo_url?: string | null;
};

export type PostOut = {
  id: number;
  type: PostType;
  content: string;
  created_at: string;
  user: PostUser;
  caret_count: number;
  has_caret?: boolean;
};
