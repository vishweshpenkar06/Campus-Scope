-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "College" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "fees" INTEGER NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "overview" TEXT NOT NULL,
    "websiteUrl" TEXT NOT NULL DEFAULT '',
    "admissionUrl" TEXT NOT NULL DEFAULT '',
    "establishedYear" INTEGER NOT NULL DEFAULT 0,
    "campusSize" TEXT NOT NULL DEFAULT '',
    "accreditation" TEXT NOT NULL DEFAULT '',
    "hostelFees" INTEGER NOT NULL DEFAULT 0,
    "hostelAvailable" BOOLEAN NOT NULL DEFAULT false,
    "facilities" TEXT NOT NULL DEFAULT '[]',
    "cautionDeposit" INTEGER NOT NULL DEFAULT 0,
    "eligibleScholarships" TEXT NOT NULL DEFAULT '[]',
    "topRecruiters" TEXT NOT NULL DEFAULT '[]',
    "studentFacultyRatio" TEXT NOT NULL DEFAULT '',
    "nirfRank" INTEGER NOT NULL DEFAULT 0,
    "autonomous" BOOLEAN NOT NULL DEFAULT false,
    "ebcConcessionPct" INTEGER NOT NULL DEFAULT 50,
    "tfwsConcessionPct" INTEGER NOT NULL DEFAULT 100,
    "scStConcessionPct" INTEGER NOT NULL DEFAULT 100,
    "minorityConcessionPct" INTEGER NOT NULL DEFAULT 30,
    "sourceUrl" TEXT,
    "sourceName" TEXT,
    "sourceDate" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "College_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "exam" TEXT,
    "percentile" DOUBLE PRECISION,
    "category" TEXT NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "Session" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("sessionToken")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "DataSource" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "license" TEXT,
    "lastRunAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StagingRecord" (
    "id" SERIAL NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "externalId" TEXT NOT NULL,
    "rawJson" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "StagingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedCollege" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "collegeId" INTEGER NOT NULL,
    "targetBranch" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Researching',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedCollege_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationTracker" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "collegeId" INTEGER,
    "label" TEXT NOT NULL,
    "round" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "notes" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationTracker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeerConnectRequest" (
    "id" SERIAL NOT NULL,
    "studentId" TEXT NOT NULL,
    "collegeId" INTEGER NOT NULL,
    "targetBranch" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PeerConnectRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpotRoundNotice" (
    "id" SERIAL NOT NULL,
    "collegeId" INTEGER NOT NULL,
    "branch" TEXT NOT NULL,
    "vacancyCount" INTEGER NOT NULL,
    "applicationDeadline" TIMESTAMP(3) NOT NULL,
    "noticePdfUrl" TEXT NOT NULL DEFAULT '',
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpotRoundNotice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpotApplication" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "noticeId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Applying',
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpotApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dedupeKey" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorSlot" (
    "id" SERIAL NOT NULL,
    "mentorId" TEXT NOT NULL,
    "collegeId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 15,
    "status" TEXT NOT NULL DEFAULT 'Open',

    CONSTRAINT "MentorSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" SERIAL NOT NULL,
    "slotId" INTEGER NOT NULL,
    "candidateId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Confirmed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumPost" (
    "id" SERIAL NOT NULL,
    "collegeId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "isSeniorAnswer" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumComment" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isSeniorAnswer" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumVote" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" INTEGER,
    "commentId" INTEGER,

    CONSTRAINT "ForumVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" SERIAL NOT NULL,
    "collegeId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "fees" INTEGER NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Placement" (
    "id" SERIAL NOT NULL,
    "collegeId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "avgPackage" DOUBLE PRECISION NOT NULL,
    "highestPackage" DOUBLE PRECISION NOT NULL,
    "placementRate" DOUBLE PRECISION NOT NULL,
    "sourceUrl" TEXT,
    "sourceName" TEXT,
    "sourceDate" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "Placement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "collegeId" INTEGER NOT NULL,
    "author" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cutoff" (
    "id" SERIAL NOT NULL,
    "collegeId" INTEGER NOT NULL,
    "exam" TEXT NOT NULL,
    "capRound" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "percentile" DOUBLE PRECISION NOT NULL,
    "year" INTEGER NOT NULL,
    "sourceUrl" TEXT,
    "sourceName" TEXT,
    "sourceDate" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "Cutoff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapRoundTrend" (
    "id" SERIAL NOT NULL,
    "collegeId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "exam" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "round1Cutoff" DOUBLE PRECISION NOT NULL,
    "round2Cutoff" DOUBLE PRECISION NOT NULL,
    "round3Cutoff" DOUBLE PRECISION NOT NULL,
    "spotRoundCutoff" DOUBLE PRECISION,
    "sourceUrl" TEXT,
    "sourceName" TEXT,
    "sourceDate" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "CapRoundTrend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeatMatrix" (
    "id" SERIAL NOT NULL,
    "collegeId" INTEGER NOT NULL,
    "branch" TEXT NOT NULL,
    "totalSeats" INTEGER NOT NULL,
    "openSeats" INTEGER NOT NULL,
    "obcSeats" INTEGER NOT NULL,
    "scSeats" INTEGER NOT NULL,
    "stSeats" INTEGER NOT NULL,
    "tfwsSeats" INTEGER NOT NULL,
    "allIndiaSeats" INTEGER NOT NULL,
    "sourceUrl" TEXT,
    "sourceName" TEXT,
    "sourceDate" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "SeatMatrix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampusInsight" (
    "id" SERIAL NOT NULL,
    "collegeId" INTEGER NOT NULL,
    "authorRole" TEXT NOT NULL,
    "attendanceStrictness" TEXT NOT NULL,
    "canteenRating" DOUBLE PRECISION NOT NULL,
    "placementSupport" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampusInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionDeadline" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "officialLink" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "AdmissionDeadline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CounsellorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "languages" TEXT[],
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "bio" TEXT NOT NULL,
    "priceRange" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CounsellorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "counsellorId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "percentile" DOUBLE PRECISION,
    "category" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" SERIAL NOT NULL,
    "page" TEXT NOT NULL DEFAULT '',
    "rating" INTEGER,
    "message" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "College_name_idx" ON "College"("name");

-- CreateIndex
CREATE INDEX "College_location_idx" ON "College"("location");

-- CreateIndex
CREATE INDEX "College_location_fees_idx" ON "College"("location", "fees");

-- CreateIndex
CREATE INDEX "College_rating_idx" ON "College"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "DataSource_name_key" ON "DataSource"("name");

-- CreateIndex
CREATE INDEX "StagingRecord_status_createdAt_idx" ON "StagingRecord"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StagingRecord_sourceId_externalId_key" ON "StagingRecord"("sourceId", "externalId");

-- CreateIndex
CREATE INDEX "SavedCollege_userId_priority_idx" ON "SavedCollege"("userId", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "SavedCollege_userId_collegeId_key" ON "SavedCollege"("userId", "collegeId");

-- CreateIndex
CREATE INDEX "ApplicationTracker_userId_idx" ON "ApplicationTracker"("userId");

-- CreateIndex
CREATE INDEX "PeerConnectRequest_collegeId_idx" ON "PeerConnectRequest"("collegeId");

-- CreateIndex
CREATE INDEX "PeerConnectRequest_studentId_idx" ON "PeerConnectRequest"("studentId");

-- CreateIndex
CREATE INDEX "SpotRoundNotice_applicationDeadline_idx" ON "SpotRoundNotice"("applicationDeadline");

-- CreateIndex
CREATE INDEX "SpotRoundNotice_collegeId_idx" ON "SpotRoundNotice"("collegeId");

-- CreateIndex
CREATE UNIQUE INDEX "SpotApplication_userId_noticeId_key" ON "SpotApplication"("userId", "noticeId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_createdAt_idx" ON "Notification"("userId", "read", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_userId_dedupeKey_key" ON "Notification"("userId", "dedupeKey");

-- CreateIndex
CREATE INDEX "MentorSlot_collegeId_status_startTime_idx" ON "MentorSlot"("collegeId", "status", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_slotId_key" ON "Booking"("slotId");

-- CreateIndex
CREATE INDEX "Booking_candidateId_idx" ON "Booking"("candidateId");

-- CreateIndex
CREATE INDEX "ForumPost_collegeId_createdAt_idx" ON "ForumPost"("collegeId", "createdAt");

-- CreateIndex
CREATE INDEX "ForumPost_collegeId_upvotes_idx" ON "ForumPost"("collegeId", "upvotes");

-- CreateIndex
CREATE INDEX "ForumComment_postId_createdAt_idx" ON "ForumComment"("postId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ForumVote_userId_postId_key" ON "ForumVote"("userId", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "ForumVote_userId_commentId_key" ON "ForumVote"("userId", "commentId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_type_label_idx" ON "AnalyticsEvent"("type", "label");

-- CreateIndex
CREATE INDEX "Course_collegeId_idx" ON "Course"("collegeId");

-- CreateIndex
CREATE INDEX "Placement_collegeId_year_idx" ON "Placement"("collegeId", "year");

-- CreateIndex
CREATE INDEX "Review_collegeId_idx" ON "Review"("collegeId");

-- CreateIndex
CREATE INDEX "Cutoff_collegeId_branch_exam_year_category_idx" ON "Cutoff"("collegeId", "branch", "exam", "year", "category");

-- CreateIndex
CREATE INDEX "Cutoff_exam_category_branch_idx" ON "Cutoff"("exam", "category", "branch");

-- CreateIndex
CREATE INDEX "Cutoff_percentile_idx" ON "Cutoff"("percentile");

-- CreateIndex
CREATE INDEX "Cutoff_verifiedAt_idx" ON "Cutoff"("verifiedAt");

-- CreateIndex
CREATE INDEX "CapRoundTrend_exam_category_branch_idx" ON "CapRoundTrend"("exam", "category", "branch");

-- CreateIndex
CREATE INDEX "CapRoundTrend_collegeId_branch_year_idx" ON "CapRoundTrend"("collegeId", "branch", "year");

-- CreateIndex
CREATE UNIQUE INDEX "CapRoundTrend_collegeId_year_exam_category_branch_key" ON "CapRoundTrend"("collegeId", "year", "exam", "category", "branch");

-- CreateIndex
CREATE UNIQUE INDEX "SeatMatrix_collegeId_branch_key" ON "SeatMatrix"("collegeId", "branch");

-- CreateIndex
CREATE INDEX "CampusInsight_collegeId_idx" ON "CampusInsight"("collegeId");

-- CreateIndex
CREATE INDEX "AdmissionDeadline_eventDate_idx" ON "AdmissionDeadline"("eventDate");

-- CreateIndex
CREATE UNIQUE INDEX "CounsellorProfile_userId_key" ON "CounsellorProfile"("userId");

-- CreateIndex
CREATE INDEX "CounsellorProfile_city_verified_idx" ON "CounsellorProfile"("city", "verified");

-- CreateIndex
CREATE INDEX "Lead_status_createdAt_idx" ON "Lead"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_counsellorId_createdAt_idx" ON "Lead"("counsellorId", "createdAt");

-- CreateIndex
CREATE INDEX "Feedback_createdAt_idx" ON "Feedback"("createdAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StagingRecord" ADD CONSTRAINT "StagingRecord_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedCollege" ADD CONSTRAINT "SavedCollege_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedCollege" ADD CONSTRAINT "SavedCollege_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationTracker" ADD CONSTRAINT "ApplicationTracker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeerConnectRequest" ADD CONSTRAINT "PeerConnectRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeerConnectRequest" ADD CONSTRAINT "PeerConnectRequest_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotRoundNotice" ADD CONSTRAINT "SpotRoundNotice_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotApplication" ADD CONSTRAINT "SpotApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotApplication" ADD CONSTRAINT "SpotApplication_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "SpotRoundNotice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorSlot" ADD CONSTRAINT "MentorSlot_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorSlot" ADD CONSTRAINT "MentorSlot_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "MentorSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumComment" ADD CONSTRAINT "ForumComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ForumPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumComment" ADD CONSTRAINT "ForumComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumVote" ADD CONSTRAINT "ForumVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumVote" ADD CONSTRAINT "ForumVote_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ForumPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumVote" ADD CONSTRAINT "ForumVote_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "ForumComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cutoff" ADD CONSTRAINT "Cutoff_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapRoundTrend" ADD CONSTRAINT "CapRoundTrend_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatMatrix" ADD CONSTRAINT "SeatMatrix_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampusInsight" ADD CONSTRAINT "CampusInsight_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellorProfile" ADD CONSTRAINT "CounsellorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_counsellorId_fkey" FOREIGN KEY ("counsellorId") REFERENCES "CounsellorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Provenance backfill for any rows present when this migration is applied.
-- Fresh databases are empty; the same statements live in scripts/backfill-provenance.ts
-- for databases that were created with `prisma db push`.
UPDATE "College" SET "sourceName" = 'legacy', "confidence" = 0.5, "verifiedAt" = NULL, "verifiedBy" = NULL WHERE "sourceName" IS NULL;
UPDATE "Cutoff" SET "sourceName" = 'legacy', "confidence" = 0.5, "verifiedAt" = NULL, "verifiedBy" = NULL WHERE "sourceName" IS NULL;
UPDATE "CapRoundTrend" SET "sourceName" = 'legacy', "confidence" = 0.5, "verifiedAt" = NULL, "verifiedBy" = NULL WHERE "sourceName" IS NULL;
UPDATE "SeatMatrix" SET "sourceName" = 'legacy', "confidence" = 0.5, "verifiedAt" = NULL, "verifiedBy" = NULL WHERE "sourceName" IS NULL;
UPDATE "Placement" SET "sourceName" = 'legacy', "confidence" = 0.5, "verifiedAt" = NULL, "verifiedBy" = NULL WHERE "sourceName" IS NULL;
