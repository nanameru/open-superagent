"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const username = formData.get("username")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password || !username) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "ユーザー名、メールアドレス、パスワードは必須項目です",
    );
  }

  const { data: { user }, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        username: username,
      }
    },
  });

  if (signUpError) {
    console.error('Sign up error details:', {
      code: signUpError.code,
      message: signUpError.message,
      details: signUpError,
    });
    return encodedRedirect("error", "/sign-up", signUpError.message);
  }

  if (user) {
    const { error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: user.id,
          username: username,
          email: email,
        }
      ]);

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return encodedRedirect("error", "/sign-up", "ユーザープロフィールの作成に失敗しました");
    }
  }

  return encodedRedirect(
    "success",
    "/sign-up",
    "登録ありがとうございます！確認メールをお送りしましたので、メール内のリンクから登録を完了してください。",
  );
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "メールアドレスを入力してください");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/(auth-pages)/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "パスワードのリセットに失敗しました",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "パスワードリセット用のリンクをメールでお送りしました。メールをご確認ください。",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "パスワードと確認用パスワードは必須項目です",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "パスワードと確認用パスワードが一致しません",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "パスワードの更新に失敗しました",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "パスワードを更新しました");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};
