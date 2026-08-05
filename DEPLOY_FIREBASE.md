# Firebase Hosting Deploy Guide — Apps Studio

প্রজেক্টটি Firebase Hosting-এ deploy করার জন্য সম্পূর্ণ প্রস্তুত।
Project ID: **apps-studio-1f1c0** (`.firebaserc`-এ সেট করা আছে)

## এক-বারের সেটআপ

```bash
# ১) Firebase CLI ইনস্টল (যদি না থাকে)
npm install -g firebase-tools

# ২) লগইন
firebase login
```

## ডিপ্লয়

```bash
# বিল্ড + হোস্টিং ডিপ্লয় একসাথে
npm run firebase:deploy
```

অথবা ম্যানুয়ালি:

```bash
npm run build            # dist/ ফোল্ডার তৈরি করে
firebase deploy --only hosting
```

### গুরুত্বপূর্ণ: Security Rules ও Indexes ডিপ্লয় করুন

Database সুরক্ষিত রাখতে অবশ্যই একবার rules ও indexes deploy করুন:

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

অথবা সব একসাথে:

```bash
firebase deploy
```

> `firestore.rules` public client-কে শুধু ক্যাটালগ **পড়তে**, download counter **+১** করতে, এবং একটি size-limited app request **জমা দিতে** দেয় — বাকি সব লেখা ব্লক করা। App/banner তৈরি/এডিট করতে হলে Firebase Console বা admin (auth token `admin:true`) দরকার।

ডিপ্লয় শেষ হলে সাইটটি এখানে লাইভ হবে:
- https://apps-studio-1f1c0.web.app
- https://apps-studio-1f1c0.firebaseapp.com

## লোকালি টেস্ট (অপশনাল)

```bash
npm run firebase:serve
```

## ফাইলসমূহ
- `firebase.json` — hosting কনফিগ (SPA rewrite + cache headers)
- `.firebaserc`   — ডিফল্ট প্রজেক্ট (apps-studio-1f1c0)
- `dist/`         — বিল্ড আউটপুট (deploy হওয়া ফোল্ডার)
