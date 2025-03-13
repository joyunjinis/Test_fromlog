const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const KakaoStrategy = require("passport-kakao").Strategy;
const pool = require("./db/mysql");
require("dotenv").config();

const app = express();

// 세션 미들웨어 설정
const sessionMiddleware = session({
  secret: "your-secret-key",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },
});

app.use(sessionMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Passport 초기화 및 세션 사용 설정
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth2 Strategy 설정
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const username = profile.emails[0].value.split("@")[0]; // 이메일 앞부분을 username으로 사용
        const email = profile.emails[0].value;
        const password = "default_password"; // 기본 비밀번호 설정
        const path = "google";
        const referrer = null;

        console.log("Google profile:", profile);

        const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
          email,
        ]);
        if (rows.length === 0) {
          await pool.query(
            "INSERT INTO users (username, email, password, path, referrer) VALUES (?, ?, ?, ?, ?)",
            [username, email, password, path, referrer]
          );
        }
        return done(null, profile);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Kakao OAuth2 Strategy 설정
passport.use(
  new KakaoStrategy(
    {
      clientID: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET,
      callbackURL: "/auth/kakao/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const username = profile.id;
        const email =
          profile._json && profile._json.kakao_account.email
            ? profile._json.kakao_account.email
            : `${profile.id}@kakao.com`;
        const password = "default_password";
        const path = "kakao";
        const referrer = null;

        console.log("Kakao profile:", profile);

        const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
          email,
        ]);

        if (rows.length === 0) {
          await pool.query(
            "INSERT INTO users (username, email, password, path, referrer) VALUES (?, ?, ?, ?, ?)",
            [username, email, password, path, referrer]
          );
        }
        return done(null, profile);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// 사용자 직렬화 및 역직렬화 설정
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// 회원가입 API
app.post("/api/auth/signup", async (req, res) => {
  const { username, email, password, path, referrer } = req.body;
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (rows.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists." });
    }
    await pool.query(
      "INSERT INTO users (username, email, password, path, referrer) VALUES (?, ?, ?, ?, ?)",
      [username, email, password, path, referrer]
    );
    return res.json({
      success: true,
      message: "User registered successfully.",
    });
  } catch (error) {
    console.error("Database error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
});

// Google OAuth2 로그인 라우트
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/calendar"); // 로그인 성공 시 /calendar로 리디렉션
  }
);

// Kakao OAuth2 로그인 라우트
app.get("/auth/kakao", passport.authenticate("kakao"));

app.get(
  "/auth/kakao/callback",
  passport.authenticate("kakao", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/calendar"); // 로그인 성공 시 /calendar로 리디렉션
  }
);

// 로그아웃 API
app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
