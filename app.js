const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const multer = require('multer');
const pool = require('./db');
const session = require('express-session');
const ejsLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const JWT_SECRET = process.env.JWT_SECRET;

// multer 설정 추가
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profile/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ storage: storage });

// 정적 파일 제공
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/mypage/images', express.static(path.join(__dirname, 'public/mypage/images')));
app.use(express.static(path.join(__dirname, 'public')));

// 뷰 엔진 세팅
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');
app.use(ejsLayouts);

// 요청 바디 파싱
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 쿠키 파서
app.use(cookieParser());

// 세션 설정
app.use(session({
  secret: 'bookmoa-secret',
  resave: false,
  saveUninitialized: true
}));

// JWT 토큰 쿠키 → 세션 동기화 미들웨어 (닉네임 DB 조회 포함)
app.use(async (req, res, next) => {
  const token = req.cookies.token;
  if (token && !req.session.user) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const [rows] = await pool.query('SELECT nickname FROM user WHERE user_id = ?', [decoded.user_id]);
      if (rows.length > 0) {
        req.session.user = {
          user_id: decoded.user_id,
          nickname: rows[0].nickname
        };
      }
    } catch (err) {
      console.error('JWT 인증 실패:', err.message);
    }
  }
  next();
});

// 레이아웃용 기본 변수 설정
app.use((req, res, next) => {
  res.locals.title = '책모아';
  res.locals.user = req.session.user || null;
  next();
});

// 로그아웃 라우터 (뷰용 POST 로그아웃 라우터)
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.error('세션 삭제 실패:', err);
    res.clearCookie('token');
    res.redirect('/');
  });
});

// 컨트롤러들 require
const { getTopBooks } = require('./controllers/popularController');
const { getLatestPosts } = require('./controllers/postsController');
const { getTrendingBooks } = require('./controllers/trendingController');
const { getNearbyLibrariesByUser } = require('./controllers/libraryController');

// 메인 페이지
app.get('/', async (req, res) => {
  let popularBooks = [];
  let latestPosts = [];
  let trendingBooks = [];
    let nearbyLibraries = [];
    if (req.session.user) {
      nearbyLibraries = await getNearbyLibrariesByUser(req.session.user.user_id);
      console.log('[최종 nearbyLibraries]', nearbyLibraries);
    }

  try {
    popularBooks = await getTopBooks();
  } catch (err) {
    console.error('[인기 도서 로딩 실패]', err.message);
  }

  try {
    latestPosts = await getLatestPosts();
  } catch (err) {
    console.error('[최신 글 로딩 실패]', err.message);
  }

  try {
    trendingBooks = await getTrendingBooks();
  } catch (err) {
    console.error('[트렌딩 로딩 실패]', err.message);
  }

  res.render('index', {
    title: '책모아 메인 페이지',
    user: req.session.user,
    popularBooks,
    latestPosts,
    trendingBooks,
    nearbyLibraries
  });
});

// 기타 라우터 등록
app.use('/posts', require('./routes/posts'));
app.use('/comments', require('./routes/comments'));

app.get('/register', (req, res) => {
  res.render('register'); // views/register.ejs
});

app.get('/login', (req, res) => {
  res.render('login'); // views/login.ejs
});

// 회원가입, 로그인
const authRouter = require('./routes/auth');
app.use('/auth', authRouter);

// 마이페이지 메인 (마이페이지 불러오기 + 메뉴들 작동)
const mypageRouter = require('./routes/mypage'); 
app.use('/mypage', mypageRouter);

// 유저 수정 정보
const userRouter = require('./routes/user');
app.use('/user', userRouter);

// 선호지역 
const preferredAreaRouter = require('./routes/preferredArea');
app.use('/preferred-area', preferredAreaRouter);

// 즐겨찾는 도서관
const favoritesRouter = require('./routes/favorites');
app.use('/mypage/favorites', favoritesRouter);

// 마이페이지에서 내가 작성한 글/댓글/리뷰 조회
const mypageGetRouter = require('./routes/mypageGet');
app.use('/mypage/get', mypageGetRouter);

// 마이페이지에서 내가 작성한 글/댓글 삭제
const mypageDeleteRouter = require('./routes/mypageDelete');  
app.use('/mypage/delete', mypageDeleteRouter);



// 커뮤니티
const communityRouter = require('./routes/community');
app.use('/community', communityRouter);

// 커뮤니티 댓글
const commentsRouter = require('./routes/comments');
app.use('/comments', commentsRouter);

// 커뮤니티(인기)
const popularRoute = require('./routes/popularRoute');
app.use('/', popularRoute);

// 도서상세
const bookRouter = require('./routes/book');
app.use('/book', bookRouter);

// 도서 리뷰
const bookReviewRouter = require('./routes/bookReviewRouter');
app.use('/bookReview', bookReviewRouter);

// 도서 검색 라우터
const trendingRoutes = require('./routes/trending');
app.use('/', trendingRoutes);

// 도서관 검색 라우터
const libraryRouter = require('./routes/library');
app.use('/library', libraryRouter);

// 도서 검색 라우터
const bookSearchRouter = require('./routes/book');
app.use('/', bookSearchRouter);

// api 라우터
const apiRouter = require('./routes/api');
app.use('/api', apiRouter);

// 에러 핸들링
app.use((err, req, res, next) => {
  console.error('서버 에러:', err.stack);
  res.status(500).json({ message: '서버 내부 에러가 발생했습니다.' });
});

// 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중`);
});
