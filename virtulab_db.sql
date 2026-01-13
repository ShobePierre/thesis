-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 11, 2026 at 10:55 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `virtulab_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `activities`
--

CREATE TABLE `activities` (
  `activity_id` int(11) NOT NULL,
  `subject_id` int(11) DEFAULT NULL,
  `instructor_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `type` enum('dragdrop','quiz','coding','other') NOT NULL DEFAULT 'dragdrop',
  `config_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`config_json`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `activities`
--

INSERT INTO `activities` (`activity_id`, `subject_id`, `instructor_id`, `title`, `description`, `type`, `config_json`, `created_at`, `updated_at`) VALUES
(27, 18, 1, 'asd', 'Sim Pc', 'dragdrop', '{\"activity_name\":\"Sim Pc\",\"instructions\":null,\"open_date_time\":\"2025-12-05T06:30:00.000Z\",\"due_date_time\":\"2025-12-13T06:30:00.000Z\"}', '2025-12-05 06:30:56', '2025-12-05 06:30:56'),
(28, 18, 1, 'Quiz 1', 'Quiz', 'quiz', '{\"activity_name\":\"Quiz\",\"instructions\":null,\"open_date_time\":\"2025-12-05T07:44:00.000Z\",\"due_date_time\":\"2025-12-06T07:44:00.000Z\"}', '2025-12-05 07:44:22', '2025-12-05 07:44:22'),
(29, 18, 1, 'Quiz 2', 'Quiz', 'quiz', '{\"activity_name\":\"Quiz\",\"instructions\":\"QUiz 2\",\"open_date_time\":\"2025-12-05T07:47:00.000Z\",\"due_date_time\":\"2025-12-06T07:47:00.000Z\"}', '2025-12-05 07:49:18', '2025-12-05 07:49:18'),
(30, 18, 1, 'Codelab', 'CodeLab', 'coding', '{\"activity_name\":\"CodeLab\",\"instructions\":\"Codelab\",\"open_date_time\":\"2025-12-05T07:56:00.000Z\",\"due_date_time\":\"2025-12-06T07:56:00.000Z\"}', '2025-12-05 07:56:54', '2025-12-05 07:56:54'),
(31, 18, 1, 'DIY Activity', 'DIY Activity', 'other', '{\"activity_name\":\"DIY Activity\",\"instructions\":null,\"open_date_time\":\"2025-12-05T07:59:00.000Z\",\"due_date_time\":\"2025-12-06T07:59:00.000Z\"}', '2025-12-05 07:59:24', '2025-12-05 07:59:24'),
(32, 18, 1, 'Dragdrop', 'Sim Pc', 'dragdrop', '{\"activity_name\":\"Sim Pc\",\"instructions\":\"Testing \",\"open_date_time\":\"2025-12-05T10:30:00.000Z\",\"due_date_time\":\"2025-12-06T10:30:00.000Z\"}', '2025-12-05 10:30:23', '2025-12-05 10:30:23'),
(42, 19, 1, 'code', 'Code Block Activity', 'other', '{\"activity_name\":\"Code Block Activity\",\"instructions\":null,\"open_date_time\":\"2026-01-11T21:32:00.000Z\",\"due_date_time\":\"2026-01-15T21:32:00.000Z\",\"language\":\"python\",\"code\":\"def calculator():\\r\\n    print(\\\"Simple Calculator\\\")\\r\\n    print(\\\"1. Add\\\")\\r\\n    print(\\\"2. Subtract\\\")\\r\\n    print(\\\"3. Multiply\\\")\\r\\n    print(\\\"4. Divide\\\")\\r\\n\\r\\n    choice = input(\\\"Choose an operation (1/2/3/4): \\\")\\r\\n    a = float(input(\\\"Enter first number: \\\"))\\r\\n    b = float(input(\\\"Enter second number: \\\"))\\r\\n\\r\\n    if choice == \\\"1\\\":\\r\\n        print(\\\"Result:\\\", a + b)\\r\\n    elif choice == \\\"2\\\":\\r\\n        print(\\\"Result:\\\", a - b)\\r\\n    elif choice == \\\"3\\\":\\r\\n        print(\\\"Result:\\\", a * b)\\r\\n    elif choice == \\\"4\\\":\\r\\n        if b != 0:\\r\\n            print(\\\"Result:\\\", a / b)\\r\\n        else:\\r\\n            print(\\\"Error: Division by zero\\\")\\r\\n    else:\\r\\n        print(\\\"Invalid choice\\\")\\r\\n\\r\\ncalculator()\\r\\n\",\"blocks\":[{\"id\":\"block_0\",\"content\":\"def calculator():\",\"type\":\"FUNCTION\",\"lineIndex\":0,\"position\":0,\"isHidden\":false,\"hint\":null,\"difficulty\":\"easy\"},{\"id\":\"block_1\",\"content\":\"print(\\\"Simple Calculator\\\")\",\"type\":\"STATEMENT\",\"lineIndex\":1,\"position\":0,\"isHidden\":false,\"hint\":null,\"difficulty\":\"easy\"},{\"id\":\"block_2\",\"content\":\"print(\\\"1. Add\\\")\",\"type\":\"STATEMENT\",\"lineIndex\":2,\"position\":0,\"isHidden\":false,\"hint\":null,\"difficulty\":\"easy\"},{\"id\":\"block_3\",\"content\":\"print(\\\"2. Subtract\\\")\",\"type\":\"STATEMENT\",\"lineIndex\":3,\"position\":0,\"isHidden\":false,\"hint\":null,\"difficulty\":\"easy\"},{\"id\":\"block_4\",\"content\":\"print(\\\"3. Multiply\\\")\",\"type\":\"STATEMENT\",\"lineIndex\":4,\"position\":0,\"isHidden\":false,\"hint\":null,\"difficulty\":\"easy\"},{\"id\":\"block_5\",\"content\":\"print(\\\"4. Divide\\\")\",\"type\":\"STATEMENT\",\"lineIndex\":5,\"position\":0,\"isHidden\":false,\"hint\":null,\"difficulty\":\"easy\"},{\"id\":\"block_6\",\"content\":\"choice = input(\\\"Choose an operation (1/2/3/4): \\\")\",\"type\":\"VARIABLE\",\"lineIndex\":7,\"position\":0,\"isHidden\":false,\"hint\":null,\"difficulty\":\"easy\"},{\"id\":\"block_7\",\"content\":\"a = float(input(\\\"Enter first number: \\\"))\",\"type\":\"VARIABLE\",\"lineIndex\":8,\"position\":0,\"isHidden\":false,\"hint\":null,\"difficulty\":\"easy\"},{\"id\":\"block_8\",\"content\":\"b = float(input(\\\"Enter second number: \\\"))\",\"type\":\"VARIABLE\",\"lineIndex\":9,\"position\":0,\"isHidden\":false,\"hint\":null,\"difficulty\":\"easy\"},{\"id\":\"block_9\",\"content\":\"if choice == \\\"1\\\":\",\"type\":\"CONDITION\",\"lineIndex\":11,\"position\":0,\"isHidden\":false,\"hint\":null,\"difficulty\":\"easy\"},{\"id\":\"block_10\",\"content\":\"print(\\\"Result:\\\", a + b)\",\"type\":\"STATEMENT\",\"lineIndex\":12,\"position\":0,\"isHidden\":false,\"hint\":null,\"difficulty\":\"easy\"},{\"id\":\"block_11\",\"content\":\"elif choice == \\\"2\\\":\",\"type\":\"STATEMENT\",\"lineIndex\":13,\"position\":0,\"isHidden\":false,\"hint\":null,\"difficulty\":\"easy\"},{\"id\":\"block_12\",\"content\":\"print(\\\"Result:\\\", a - b)\",\"type\":\"STATEMENT\",\"lineIndex\":14,\"position\":0,\"isHidden\":false,\"hint\":null,\"difficulty\":\"easy\"},{\"id\":\"block_13\",\"content\":\"elif choice == \\\"3\\\":\",\"type\":\"STATEMENT\",\"lineIndex\":15,\"position\":0,\"isHidden\":false,\"hint\":null,\"difficulty\":\"easy\"},{\"id\":\"block_14\",\"content\":\"print(\\\"Result:\\\", a * b)\",\"type\":\"STATEMENT\",\"lineIndex\":16,\"position\":0,\"isHidden\":false,\"hint\":null,\"difficulty\":\"easy\"},{\"id\":\"block_15\",\"content\":\"elif choice == \\\"4\\\":\",\"type\":\"STATEMENT\",\"lineIndex\":17,\"position\":0,\"isHidden\":false,\"hint\":null,\"difficulty\":\"easy\"},{\"id\":\"block_16\",\"content\":\"if b != 0:\",\"type\":\"CONDITION\",\"lineIndex\":18,\"position\":0,\"isHidden\":false,\"hint\":null,\"difficulty\":\"easy\"},{\"id\":\"block_17\",\"content\":\"print(\\\"Result:\\\", a / b)\",\"type\":\"STATEMENT\",\"lineIndex\":19,\"position\":0,\"isHidden\":false,\"hint\":null,\"difficulty\":\"easy\"},{\"id\":\"block_18\",\"content\":\"else:\",\"type\":\"CONDITION\",\"lineIndex\":20,\"position\":0,\"isHidden\":false,\"hint\":null,\"difficulty\":\"easy\"},{\"id\":\"block_19\",\"content\":\"print(\\\"Error: Division by zero\\\")\",\"type\":\"STATEMENT\",\"lineIndex\":21,\"position\":0,\"isHidden\":false,\"hint\":null,\"difficulty\":\"easy\"},{\"id\":\"block_20\",\"content\":\"else:\",\"type\":\"CONDITION\",\"lineIndex\":22,\"position\":0,\"isHidden\":false,\"hint\":null,\"difficulty\":\"easy\"},{\"id\":\"block_21\",\"content\":\"print(\\\"Invalid choice\\\")\",\"type\":\"STATEMENT\",\"lineIndex\":23,\"position\":0,\"isHidden\":false,\"hint\":null,\"difficulty\":\"easy\"},{\"id\":\"block_22\",\"content\":\"calculator()\",\"type\":\"STATEMENT\",\"lineIndex\":25,\"position\":0,\"isHidden\":false,\"hint\":null,\"difficulty\":\"easy\"}],\"hiddenBlockIds\":[\"block_22\",\"block_18\",\"block_16\"],\"difficulty\":\"easy\",\"hints\":{}}', '2026-01-11 21:32:38', '2026-01-11 21:32:38');

-- --------------------------------------------------------

--
-- Table structure for table `activities_classwork`
--

CREATE TABLE `activities_classwork` (
  `id` int(11) NOT NULL,
  `activity_id` int(11) NOT NULL,
  `asset_type` enum('PHOTO_VIDEO','FILE') NOT NULL DEFAULT 'FILE',
  `original_name` varchar(255) NOT NULL,
  `stored_name` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `open_date_time` datetime DEFAULT NULL,
  `due_date_time` datetime DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `file_size` bigint(20) UNSIGNED DEFAULT 0,
  `uploaded_by` int(11) DEFAULT NULL,
  `uploaded_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `activities_classwork`
--

INSERT INTO `activities_classwork` (`id`, `activity_id`, `asset_type`, `original_name`, `stored_name`, `file_path`, `open_date_time`, `due_date_time`, `mime_type`, `file_size`, `uploaded_by`, `uploaded_at`) VALUES
(6, 31, 'FILE', 'virtulab (1).png', '1764921564684-998843670-virtulab (1).png', '/uploads/activity_files/1764921564684-998843670-virtulab (1).png', '2025-12-05 07:59:00', '2025-12-06 07:59:00', 'image/png', 429445, 1, '2025-12-05 15:59:24');

-- --------------------------------------------------------

--
-- Table structure for table `activity_items`
--

CREATE TABLE `activity_items` (
  `item_id` int(11) NOT NULL,
  `activity_id` int(11) NOT NULL,
  `question_text` text DEFAULT NULL,
  `answer_key` text DEFAULT NULL,
  `points` decimal(5,2) DEFAULT 1.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `activity_quiz_links`
--

CREATE TABLE `activity_quiz_links` (
  `link_id` int(11) NOT NULL,
  `activity_id` int(11) NOT NULL,
  `quiz_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `activity_quiz_links`
--

INSERT INTO `activity_quiz_links` (`link_id`, `activity_id`, `quiz_id`, `created_at`) VALUES
(2, 28, 2, '2025-12-05 07:44:22'),
(3, 29, 3, '2025-12-05 07:49:18');

-- --------------------------------------------------------

--
-- Table structure for table `activity_submissions`
--

CREATE TABLE `activity_submissions` (
  `submission_id` int(11) NOT NULL,
  `activity_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `submission_text` longtext DEFAULT NULL,
  `grade` decimal(5,2) DEFAULT NULL,
  `performance_score` decimal(5,2) DEFAULT NULL,
  `performance_grade` char(1) DEFAULT NULL,
  `performance_report` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`performance_report`)),
  `feedback` text DEFAULT NULL,
  `checkpoint_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`checkpoint_data`)),
  `performance_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`performance_data`)),
  `submitted_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `activity_submission_attachments`
--

CREATE TABLE `activity_submission_attachments` (
  `attachment_id` int(11) NOT NULL,
  `submission_id` int(11) NOT NULL,
  `original_name` varchar(255) DEFAULT NULL,
  `stored_name` varchar(255) DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL,
  `uploaded_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `announcements`
--

CREATE TABLE `announcements` (
  `announcement_id` int(10) UNSIGNED NOT NULL,
  `subject_id` int(10) UNSIGNED NOT NULL,
  `instructor_id` int(10) UNSIGNED NOT NULL,
  `content` text NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `log_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `action` varchar(255) NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `old_value` longtext DEFAULT NULL,
  `new_value` longtext DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`log_id`, `user_id`, `action`, `entity_type`, `entity_id`, `old_value`, `new_value`, `ip_address`, `user_agent`, `created_at`) VALUES
(1, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:25:04'),
(2, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:25:04'),
(3, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:25:11'),
(4, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:25:11'),
(5, 12, 'export_users_json', 'export', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:26:33'),
(6, 12, 'export_users_csv', 'export', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:26:36'),
(7, 12, 'export_submissions_csv', 'export', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:26:46'),
(8, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:28:24'),
(9, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:28:24'),
(10, 12, 'view_system_config', 'config', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:29:12'),
(11, 12, 'view_system_config', 'config', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:29:12'),
(12, 12, 'view_audit_logs', 'audit', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:29:12'),
(13, 12, 'view_audit_logs', 'audit', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:29:12'),
(14, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:29:13'),
(15, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:29:13'),
(16, 12, 'view_audit_logs', 'audit', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:29:15'),
(17, 12, 'view_audit_logs', 'audit', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:29:15'),
(18, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:29:15'),
(19, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:29:15'),
(20, 12, 'view_audit_logs', 'audit', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:29:17'),
(21, 12, 'view_audit_logs', 'audit', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:29:17'),
(22, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:29:25'),
(23, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:29:25'),
(24, 12, 'view_audit_logs', 'audit', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:29:26'),
(25, 12, 'view_audit_logs', 'audit', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:29:26'),
(26, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:29:28'),
(27, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:29:28'),
(28, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:29:54'),
(29, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:29:54'),
(30, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:32:50'),
(31, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:32:50'),
(32, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:33:06'),
(33, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:33:06'),
(34, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:33:06'),
(35, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:33:06'),
(36, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:33:07'),
(37, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:33:07'),
(38, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:33:07'),
(39, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:33:08'),
(40, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:33:08'),
(41, 12, 'view_audit_logs', 'audit', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:33:10'),
(42, 12, 'view_audit_logs', 'audit', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:33:10'),
(43, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:33:11'),
(44, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:33:11'),
(45, 12, 'view_audit_logs', 'audit', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:33:39'),
(46, 12, 'view_audit_logs', 'audit', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:33:39'),
(47, 12, 'view_system_config', 'config', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:33:39'),
(48, 12, 'view_system_config', 'config', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:33:39'),
(49, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:34:59'),
(50, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:34:59'),
(51, 12, 'view_audit_logs', 'audit', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:35:01'),
(52, 12, 'view_audit_logs', 'audit', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:35:01'),
(53, 12, 'view_system_config', 'config', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:35:01'),
(54, 12, 'view_system_config', 'config', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:35:01'),
(55, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:35:02'),
(56, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:35:02'),
(57, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:37:26'),
(58, 12, 'create_user', 'user', 13, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:38:09'),
(59, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:38:09'),
(60, 12, 'export_submissions_csv', 'export', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:38:28'),
(61, 12, 'view_system_config', 'config', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:38:34'),
(62, 12, 'view_system_config', 'config', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:38:34'),
(63, 12, 'view_audit_logs', 'audit', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:38:34'),
(64, 12, 'view_audit_logs', 'audit', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:38:34'),
(65, 12, 'view_system_config', 'config', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:38:42'),
(66, 12, 'view_system_config', 'config', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:38:42'),
(67, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:43:58'),
(68, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:43:58'),
(69, 12, 'view_audit_logs', 'audit', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:43:59'),
(70, 12, 'view_audit_logs', 'audit', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:43:59'),
(71, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:44:00'),
(72, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:44:00'),
(73, 12, 'view_audit_logs', 'audit', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:44:02'),
(74, 12, 'view_audit_logs', 'audit', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:44:02'),
(75, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:44:03'),
(76, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:44:03'),
(77, 12, 'view_all_users', 'user', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0', '2026-01-11 14:44:44');

-- --------------------------------------------------------

--
-- Table structure for table `dragdrop_attempts`
--

CREATE TABLE `dragdrop_attempts` (
  `attempt_id` int(11) NOT NULL,
  `activity_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `submission_id` int(11) DEFAULT NULL,
  `started_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `submitted_at` timestamp NULL DEFAULT NULL,
  `time_taken_seconds` int(11) DEFAULT NULL,
  `overall_score` decimal(5,2) DEFAULT NULL,
  `overall_percentage` decimal(5,2) DEFAULT NULL,
  `letter_grade` char(1) DEFAULT NULL,
  `completion_status` enum('in_progress','completed','abandoned') DEFAULT 'in_progress',
  `cpu_score` decimal(5,2) DEFAULT NULL,
  `cmos_score` decimal(5,2) DEFAULT NULL,
  `ram_score` decimal(5,2) DEFAULT NULL,
  `total_wrong_attempts` int(11) DEFAULT 0,
  `total_correct_attempts` int(11) DEFAULT 0,
  `total_drag_operations` int(11) DEFAULT 0,
  `total_idle_seconds` int(11) DEFAULT 0,
  `sequence_followed` tinyint(4) DEFAULT 1,
  `cpu_duration` int(11) DEFAULT NULL,
  `cpu_wrong_attempts` int(11) DEFAULT 0,
  `cpu_first_try_success` tinyint(4) DEFAULT 0,
  `cmos_duration` int(11) DEFAULT NULL,
  `cmos_wrong_attempts` int(11) DEFAULT 0,
  `cmos_first_try_success` tinyint(4) DEFAULT 0,
  `ram_duration` int(11) DEFAULT NULL,
  `ram_wrong_attempts` int(11) DEFAULT 0,
  `ram_first_try_success` tinyint(4) DEFAULT 0,
  `full_report` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`full_report`)),
  `event_log` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`event_log`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `dragdrop_attempts`
--

INSERT INTO `dragdrop_attempts` (`attempt_id`, `activity_id`, `student_id`, `submission_id`, `started_at`, `submitted_at`, `time_taken_seconds`, `overall_score`, `overall_percentage`, `letter_grade`, `completion_status`, `cpu_score`, `cmos_score`, `ram_score`, `total_wrong_attempts`, `total_correct_attempts`, `total_drag_operations`, `total_idle_seconds`, `sequence_followed`, `cpu_duration`, `cpu_wrong_attempts`, `cpu_first_try_success`, `cmos_duration`, `cmos_wrong_attempts`, `cmos_first_try_success`, `ram_duration`, `ram_wrong_attempts`, `ram_first_try_success`, `full_report`, `event_log`) VALUES
(24, 27, 2, 19, '2025-12-05 06:31:20', '2025-12-05 06:31:20', 0, 0.00, 0.00, 'F', 'completed', 0.00, 0.00, 0.00, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 'null', '[]'),
(25, 27, 2, 19, '2025-12-05 06:31:27', '2025-12-05 06:31:27', 0, 0.00, 0.00, 'F', 'completed', 0.00, 0.00, 0.00, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 'null', '[]'),
(26, 27, 2, 19, '2025-12-05 06:31:50', '2025-12-05 06:31:50', 0, 0.00, 0.00, 'F', 'completed', 0.00, 0.00, 0.00, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 'null', '[]'),
(27, 27, 2, 19, '2025-12-05 06:31:53', '2025-12-05 06:31:53', 0, 0.00, 0.00, 'F', 'completed', 0.00, 0.00, 0.00, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 'null', '[]'),
(28, 27, 2, 19, '2025-12-05 06:31:58', '2025-12-05 06:31:58', 0, 0.00, 0.00, 'F', 'completed', 0.00, 0.00, 0.00, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 'null', '[]'),
(29, 27, 2, 19, '2025-12-05 06:32:01', '2025-12-05 06:32:01', 2147483647, 30.00, 30.00, 'F', 'completed', 0.00, 0.00, 0.00, 0, 0, 0, 0, 1, 1764916310, 0, 0, 1764916313, 0, 0, 1764916318, 0, 0, '{\"overallScore\":30,\"letterGrade\":\"F\",\"componentScores\":{\"cpu\":0,\"cmos\":0,\"ram\":0},\"accuracy\":{\"totalAttempts\":0,\"correctAttempts\":0,\"wrongAttempts\":0,\"accuracyRate\":null},\"efficiency\":{\"cpu\":{\"duration\":1764916310.116,\"benchmark\":45,\"performance\":\"Needs Improvement\"},\"cmos\":{\"duration\":1764916313.196,\"benchmark\":30,\"performance\":\"Needs Improvement\"},\"ram\":{\"duration\":1764916318.374,\"benchmark\":40,\"performance\":\"Needs Improvement\"}},\"summary\":{\"totalTime\":5294748942,\"idleTime\":0,\"dragOperations\":0},\"strengths\":[\"Completed all required tasks\"],\"improvements\":[\"Improve speed on: CPU, CMOS, RAM\"]}', '[]'),
(30, 27, 2, 19, '2025-12-05 10:31:07', '2025-12-05 10:31:07', 0, 0.00, 0.00, 'F', 'completed', 0.00, 0.00, 0.00, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 'null', '[]'),
(31, 27, 2, 19, '2025-12-05 10:31:20', '2025-12-05 10:31:20', 0, 0.00, 0.00, 'F', 'completed', 0.00, 0.00, 0.00, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 'null', '[]'),
(32, 27, 2, 19, '2025-12-05 10:31:28', '2025-12-05 10:31:28', 0, 0.00, 0.00, 'F', 'completed', 0.00, 0.00, 0.00, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 'null', '[]');

-- --------------------------------------------------------

--
-- Table structure for table `dragdrop_scores`
--

CREATE TABLE `dragdrop_scores` (
  `score_id` int(11) NOT NULL,
  `activity_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `component_type` varchar(50) NOT NULL,
  `best_score` decimal(5,2) DEFAULT 0.00,
  `best_percentage` decimal(5,2) DEFAULT 0.00,
  `best_attempt_id` int(11) DEFAULT NULL,
  `attempt_count` int(11) DEFAULT 1,
  `completed` tinyint(4) DEFAULT 0,
  `best_letter_grade` char(1) DEFAULT NULL,
  `last_attempt_date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `dragdrop_scores`
--

INSERT INTO `dragdrop_scores` (`score_id`, `activity_id`, `student_id`, `component_type`, `best_score`, `best_percentage`, `best_attempt_id`, `attempt_count`, `completed`, `best_letter_grade`, `last_attempt_date`, `created_at`) VALUES
(24, 27, 2, 'overall', 30.00, 30.00, NULL, 9, 1, 'F', '2025-12-05 10:31:28', '2025-12-05 06:31:20');

-- --------------------------------------------------------

--
-- Table structure for table `files`
--

CREATE TABLE `files` (
  `file_id` int(11) NOT NULL,
  `uploaded_by` int(11) NOT NULL,
  `activity_id` int(11) DEFAULT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `file_type` varchar(50) DEFAULT NULL,
  `uploaded_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `type` enum('system','activity','submission','feedback') DEFAULT 'system',
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notification_id`, `user_id`, `message`, `type`, `is_read`, `created_at`) VALUES
(33, 2, 'New activity: DragDrop', 'activity', 0, '2025-12-05 14:18:03'),
(34, 2, 'New activity: drag', 'activity', 0, '2025-12-05 14:26:12'),
(35, 2, 'New activity: asd', 'activity', 0, '2025-12-05 14:30:56'),
(36, 2, 'New activity: Quiz 1', 'activity', 0, '2025-12-05 15:44:22'),
(37, 2, 'New activity: Quiz 2', 'activity', 0, '2025-12-05 15:49:18'),
(38, 2, 'Your submission for \"Quiz 2\" was graded: 66', 'feedback', 0, '2025-12-05 15:55:07'),
(39, 2, 'New activity: Codelab', 'activity', 0, '2025-12-05 15:56:54'),
(40, 2, 'New activity: DIY Activity', 'activity', 0, '2025-12-05 15:59:24'),
(41, 2, 'New activity: Dragdrop', 'activity', 0, '2025-12-05 18:30:23'),
(42, 2, 'Your submission for \"asd\" was graded: 100', 'feedback', 0, '2025-12-05 18:43:55'),
(43, 8, 'New activity: Test Compiler', 'activity', 0, '2026-01-11 04:18:22'),
(44, 8, 'New activity: dragdrop', 'activity', 0, '2026-01-11 15:27:54'),
(45, 2, 'New activity: dragdrop', 'activity', 0, '2026-01-11 15:27:54'),
(46, 8, 'New activity: Dragdrop COde block', 'activity', 0, '2026-01-12 03:20:25'),
(47, 2, 'New activity: Dragdrop COde block', 'activity', 0, '2026-01-12 03:20:25'),
(48, 8, 'New activity: asdad', 'activity', 0, '2026-01-12 03:31:15'),
(49, 2, 'New activity: asdad', 'activity', 0, '2026-01-12 03:31:15'),
(50, 8, 'New activity: activity', 'activity', 0, '2026-01-12 03:34:20'),
(51, 2, 'New activity: activity', 'activity', 0, '2026-01-12 03:34:20'),
(52, 8, 'New activity: Code Block', 'activity', 0, '2026-01-12 03:55:14'),
(53, 2, 'New activity: Code Block', 'activity', 0, '2026-01-12 03:55:14'),
(54, 8, 'New activity: Code Block', 'activity', 0, '2026-01-12 04:04:08'),
(55, 2, 'New activity: Code Block', 'activity', 0, '2026-01-12 04:04:08'),
(56, 8, 'New activity: test', 'activity', 0, '2026-01-12 04:38:41'),
(57, 2, 'New activity: test', 'activity', 0, '2026-01-12 04:38:41'),
(58, 8, 'New activity: code', 'activity', 0, '2026-01-12 05:07:29'),
(59, 2, 'New activity: code', 'activity', 0, '2026-01-12 05:07:29'),
(60, 8, 'New activity: code', 'activity', 0, '2026-01-12 05:32:38'),
(61, 2, 'New activity: code', 'activity', 0, '2026-01-12 05:32:38');

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `permission_id` int(11) NOT NULL,
  `permission_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`permission_id`, `permission_name`, `description`, `created_at`) VALUES
(1, 'manage_users', 'Create, edit, delete users', '2026-01-11 05:46:08'),
(2, 'view_submissions', 'View code submissions', '2026-01-11 05:46:08'),
(3, 'export_data', 'Export system data to CSV/JSON', '2026-01-11 05:46:08'),
(4, 'view_audit_logs', 'View system audit logs', '2026-01-11 05:46:08'),
(5, 'manage_settings', 'Modify system configuration', '2026-01-11 05:46:08'),
(6, 'reset_database', 'Reset databases', '2026-01-11 05:46:08'),
(7, 'manage_courses', 'Create and manage courses', '2026-01-11 05:46:08'),
(8, 'grade_submissions', 'Grade student submissions', '2026-01-11 05:46:08'),
(9, 'create_activities', 'Create course activities', '2026-01-11 05:46:08'),
(10, 'submit_assignments', 'Submit assignments', '2026-01-11 05:46:08');

-- --------------------------------------------------------

--
-- Table structure for table `posting_teacher`
--

CREATE TABLE `posting_teacher` (
  `posting_id` int(10) UNSIGNED NOT NULL,
  `announcement_id` int(10) UNSIGNED NOT NULL,
  `asset_type` enum('PHOTO_VIDEO','FILE') NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `stored_name` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `file_size` bigint(20) UNSIGNED DEFAULT 0,
  `uploaded_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quizzes`
--

CREATE TABLE `quizzes` (
  `quiz_id` int(11) NOT NULL,
  `instructor_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `is_published` tinyint(1) DEFAULT 0,
  `total_points` decimal(10,2) DEFAULT 0.00,
  `time_limit_minutes` int(11) DEFAULT NULL,
  `passing_score` decimal(5,2) DEFAULT 60.00,
  `shuffle_questions` tinyint(1) DEFAULT 0,
  `shuffle_choices` tinyint(1) DEFAULT 0,
  `show_score_immediately` tinyint(1) DEFAULT 1,
  `allow_review` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `quizzes`
--

INSERT INTO `quizzes` (`quiz_id`, `instructor_id`, `title`, `description`, `is_published`, `total_points`, `time_limit_minutes`, `passing_score`, `shuffle_questions`, `shuffle_choices`, `show_score_immediately`, `allow_review`, `created_at`, `updated_at`) VALUES
(2, 1, 'Quiz 1', NULL, 0, 0.00, 45, 50.00, 0, 0, 1, 1, '2025-12-05 07:44:11', '2025-12-05 07:44:11'),
(3, 1, 'Quiz 2', NULL, 0, 0.00, 45, 60.00, 0, 0, 1, 1, '2025-12-05 07:49:12', '2025-12-05 07:49:12');

-- --------------------------------------------------------

--
-- Table structure for table `quiz_answers`
--

CREATE TABLE `quiz_answers` (
  `answer_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `correct_answer_text` longtext NOT NULL,
  `case_sensitive` tinyint(1) DEFAULT 0,
  `exact_match_required` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quiz_attempts`
--

CREATE TABLE `quiz_attempts` (
  `attempt_id` int(11) NOT NULL,
  `quiz_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `activity_id` int(11) DEFAULT NULL,
  `score` decimal(10,2) DEFAULT NULL,
  `percentage` decimal(5,2) DEFAULT NULL,
  `passed` tinyint(1) DEFAULT 0,
  `started_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `submitted_at` timestamp NULL DEFAULT NULL,
  `time_taken_seconds` int(11) DEFAULT NULL,
  `is_completed` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `quiz_attempts`
--

INSERT INTO `quiz_attempts` (`attempt_id`, `quiz_id`, `student_id`, `activity_id`, `score`, `percentage`, `passed`, `started_at`, `submitted_at`, `time_taken_seconds`, `is_completed`) VALUES
(3, 2, 2, 28, 3.00, 100.00, 1, '2025-12-05 07:45:02', '2025-12-05 07:45:11', 9, 1),
(4, 3, 2, 29, 2.00, 66.67, 1, '2025-12-05 07:49:31', '2025-12-05 07:49:40', 9, 1);

-- --------------------------------------------------------

--
-- Table structure for table `quiz_attempt_answers`
--

CREATE TABLE `quiz_attempt_answers` (
  `attempt_answer_id` int(11) NOT NULL,
  `attempt_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `student_answer` longtext DEFAULT NULL,
  `is_correct` tinyint(1) DEFAULT 0,
  `points_earned` decimal(10,2) DEFAULT 0.00,
  `answered_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `quiz_attempt_answers`
--

INSERT INTO `quiz_attempt_answers` (`attempt_answer_id`, `attempt_id`, `question_id`, `student_answer`, `is_correct`, `points_earned`, `answered_at`) VALUES
(2, 3, 2, '1', 1, 1.00, '2025-12-05 07:45:11'),
(3, 3, 3, '7', 1, 1.00, '2025-12-05 07:45:11'),
(4, 3, 4, '12', 1, 1.00, '2025-12-05 07:45:11'),
(5, 4, 5, '16', 1, 1.00, '2025-12-05 07:49:40'),
(6, 4, 6, '19', 0, 0.00, '2025-12-05 07:49:40'),
(7, 4, 7, '21', 1, 1.00, '2025-12-05 07:49:40');

-- --------------------------------------------------------

--
-- Table structure for table `quiz_questions`
--

CREATE TABLE `quiz_questions` (
  `question_id` int(11) NOT NULL,
  `quiz_id` int(11) NOT NULL,
  `question_text` text NOT NULL,
  `question_type` enum('multiple_choice','checkbox','short_answer') NOT NULL,
  `points` decimal(10,2) DEFAULT 1.00,
  `order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `quiz_questions`
--

INSERT INTO `quiz_questions` (`question_id`, `quiz_id`, `question_text`, `question_type`, `points`, `order`, `created_at`, `updated_at`) VALUES
(2, 2, 'Gold', 'multiple_choice', 1.00, 0, '2025-12-05 07:44:11', '2025-12-05 07:44:11'),
(3, 2, 'Silver', 'multiple_choice', 1.00, 1, '2025-12-05 07:44:11', '2025-12-05 07:44:11'),
(4, 2, 'Bronze', 'multiple_choice', 1.00, 2, '2025-12-05 07:44:11', '2025-12-05 07:44:11'),
(5, 3, 'Hey', 'multiple_choice', 1.00, 0, '2025-12-05 07:49:12', '2025-12-05 07:49:12'),
(6, 3, 'Nc', 'multiple_choice', 1.00, 1, '2025-12-05 07:49:12', '2025-12-05 07:49:12'),
(7, 3, 'GeGe', 'multiple_choice', 1.00, 2, '2025-12-05 07:49:12', '2025-12-05 07:49:12');

-- --------------------------------------------------------

--
-- Table structure for table `quiz_question_choices`
--

CREATE TABLE `quiz_question_choices` (
  `choice_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `choice_text` text NOT NULL,
  `is_correct` tinyint(1) DEFAULT 0,
  `order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `quiz_question_choices`
--

INSERT INTO `quiz_question_choices` (`choice_id`, `question_id`, `choice_text`, `is_correct`, `order`, `created_at`) VALUES
(1, 2, 'Gold', 1, 0, '2025-12-05 07:44:11'),
(2, 2, '2', 0, 1, '2025-12-05 07:44:11'),
(3, 2, '2', 0, 2, '2025-12-05 07:44:11'),
(4, 2, '2', 0, 3, '2025-12-05 07:44:11'),
(5, 3, '2', 0, 0, '2025-12-05 07:44:11'),
(6, 3, '2', 0, 1, '2025-12-05 07:44:11'),
(7, 3, 'Silver', 1, 2, '2025-12-05 07:44:11'),
(8, 3, '2', 0, 3, '2025-12-05 07:44:11'),
(9, 4, '3', 0, 0, '2025-12-05 07:44:11'),
(10, 4, '3', 0, 1, '2025-12-05 07:44:11'),
(11, 4, '3', 0, 2, '2025-12-05 07:44:11'),
(12, 4, 'Bronze', 1, 3, '2025-12-05 07:44:11'),
(13, 5, '1', 0, 0, '2025-12-05 07:49:12'),
(14, 5, '1', 0, 1, '2025-12-05 07:49:12'),
(15, 5, '1', 0, 2, '2025-12-05 07:49:12'),
(16, 5, 'Hey', 1, 3, '2025-12-05 07:49:12'),
(17, 6, '2', 0, 0, '2025-12-05 07:49:12'),
(18, 6, 'Nc', 1, 1, '2025-12-05 07:49:12'),
(19, 6, '2', 0, 2, '2025-12-05 07:49:12'),
(20, 6, '2', 0, 3, '2025-12-05 07:49:12'),
(21, 7, 'GeGe', 1, 0, '2025-12-05 07:49:12'),
(22, 7, '3', 0, 1, '2025-12-05 07:49:12'),
(23, 7, '3', 0, 2, '2025-12-05 07:49:12'),
(24, 7, '3', 0, 3, '2025-12-05 07:49:12');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `role_id` int(11) NOT NULL,
  `role_name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`role_id`, `role_name`, `description`, `created_at`) VALUES
(1, 'super_admin', 'System administrator with full access', '2026-01-11 05:46:08'),
(2, 'admin', 'Instructor with course management access', '2026-01-11 05:46:08'),
(3, 'student', 'Student with course enrollment and submission access', '2026-01-11 05:46:08');

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `role_permission_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `role_permissions`
--

INSERT INTO `role_permissions` (`role_permission_id`, `role_id`, `permission_id`, `created_at`) VALUES
(1, 1, 1, '2026-01-11 05:46:08'),
(2, 1, 2, '2026-01-11 05:46:08'),
(3, 1, 3, '2026-01-11 05:46:08'),
(4, 1, 4, '2026-01-11 05:46:08'),
(5, 1, 5, '2026-01-11 05:46:08'),
(6, 1, 6, '2026-01-11 05:46:08'),
(7, 2, 2, '2026-01-11 05:46:08'),
(8, 2, 7, '2026-01-11 05:46:08'),
(9, 2, 8, '2026-01-11 05:46:08'),
(10, 2, 9, '2026-01-11 05:46:08'),
(11, 3, 2, '2026-01-11 05:46:08'),
(12, 3, 10, '2026-01-11 05:46:08');

-- --------------------------------------------------------

--
-- Table structure for table `student_scores`
--

CREATE TABLE `student_scores` (
  `score_id` int(11) NOT NULL,
  `quiz_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `activity_id` int(11) DEFAULT NULL,
  `best_score` decimal(10,2) DEFAULT 0.00,
  `best_percentage` decimal(5,2) DEFAULT 0.00,
  `best_attempt_id` int(11) DEFAULT NULL,
  `attempt_count` int(11) DEFAULT 1,
  `first_attempt_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_attempt_date` timestamp NULL DEFAULT NULL,
  `passed` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `student_scores`
--

INSERT INTO `student_scores` (`score_id`, `quiz_id`, `student_id`, `activity_id`, `best_score`, `best_percentage`, `best_attempt_id`, `attempt_count`, `first_attempt_date`, `last_attempt_date`, `passed`) VALUES
(2, 2, 2, 28, 3.00, 100.00, 3, 1, '2025-12-05 07:45:11', NULL, 1),
(3, 3, 2, 29, 2.00, 66.67, 4, 1, '2025-12-05 07:49:40', NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `student_subjects`
--

CREATE TABLE `student_subjects` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `joined_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `student_subjects`
--

INSERT INTO `student_subjects` (`id`, `student_id`, `subject_id`, `joined_at`) VALUES
(9, 2, 18, '2025-12-05 14:17:48'),
(10, 8, 19, '2026-01-11 04:11:03'),
(11, 2, 19, '2026-01-11 15:20:09');

-- --------------------------------------------------------

--
-- Table structure for table `subjects`
--

CREATE TABLE `subjects` (
  `subject_id` int(11) NOT NULL,
  `instructor_id` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `class_code` varchar(10) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `is_archived` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subjects`
--

INSERT INTO `subjects` (`subject_id`, `instructor_id`, `title`, `description`, `class_code`, `created_at`, `is_archived`) VALUES
(18, 1, 'Testing', '123', 'UI26LV85V5', '2025-12-05 14:17:20', 0),
(19, 1, 'Science', 'BSINFOTECH 4-B', 'WPASXIQXD6', '2025-12-05 15:56:16', 0);

-- --------------------------------------------------------

--
-- Table structure for table `submissions`
--

CREATE TABLE `submissions` (
  `submission_id` int(11) NOT NULL,
  `activity_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `submission_data` text DEFAULT NULL,
  `grade` decimal(5,2) DEFAULT NULL,
  `feedback` text DEFAULT NULL,
  `submitted_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `role_id`, `username`, `email`, `password`, `created_at`, `updated_at`) VALUES
(1, 2, 'Prof', 'shobe@gmail.com', '$2b$10$uPneKGkXvMvlHBQHvQewV.dSvdPQZrbmDCwcXjYVWg/XygEJ7aTSa', '2025-10-28 05:43:52', '2025-12-05 15:53:23'),
(2, 3, 'seb', 'seb@gmail.com', '$2b$10$fDcrqN2o8D6jm1zg2G6WAOTru6zNmmCH7ye8HBtJ4xGBy.jlGMEVa', '2025-11-03 14:20:00', '2026-01-11 15:20:21'),
(3, 2, 'Ivell', 'ivell@gmail.com', '$2b$10$epPsxKICZV9buskzta74XuJ8A2Ib6N6883Orc9P0DjNx.5S7NOk82', '2025-11-11 20:41:56', '2025-11-11 23:26:57'),
(8, 3, 'josh', 'juswa@email.com', '$2b$10$7.O.7.v/DV5YBVgkNcCf1eOKYFu9BteBum6CqB5DyP6YwjVMo1NrO', '2025-12-05 11:41:44', '2026-01-11 15:10:50'),
(12, 1, 'superadmin', 'admin@example.com', '$2b$10$jDe4B4.DSsnCE0oz1VDsUetUyVR/QrfUSLqy6E0vpWUfUSG2piG7S', '2026-01-11 13:54:16', '2026-01-11 14:02:54'),
(13, 3, 'tester', 'testingstudent@gmail', '$2b$10$0j4JdbzLoXVZIGwyYDK2WecGIe5Bv.ta6UBQbCKJcvHJt8dj6GFq.', '2026-01-11 14:38:09', '2026-01-11 14:38:09');

-- --------------------------------------------------------

--
-- Table structure for table `user_avatars`
--

CREATE TABLE `user_avatars` (
  `avatar_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `stored_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `file_size` bigint(20) UNSIGNED DEFAULT 0,
  `is_current` tinyint(1) DEFAULT 0,
  `uploaded_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_avatars`
--

INSERT INTO `user_avatars` (`avatar_id`, `user_id`, `original_name`, `stored_name`, `file_path`, `mime_type`, `file_size`, `is_current`, `uploaded_at`) VALUES
(20, 1, 'Test 1.jpg', '1764912611272-Test_1.jpg', '/uploads/avatars/1764912611272-Test_1.jpg', 'image/jpeg', 3166, 0, '2025-12-05 13:30:12'),
(21, 2, 'Test 2.png', '1764912635608-Test_2.png', '/uploads/avatars/1764912635608-Test_2.png', 'image/png', 6065, 0, '2025-12-05 13:30:35'),
(22, 1, 'Test 2.png', '1764921202545-Test_2.png', '/uploads/avatars/1764921202545-Test_2.png', 'image/png', 6065, 1, '2025-12-05 15:53:23'),
(23, 2, 'Test 1.jpg', '1764921219978-Test_1.jpg', '/uploads/avatars/1764921219978-Test_1.jpg', 'image/jpeg', 3166, 0, '2025-12-05 15:53:40'),
(24, 2, 'virtulab (1).png', '1764929689510-virtulab__1_.png', '/uploads/avatars/1764929689510-virtulab__1_.png', 'image/png', 429445, 0, '2025-12-05 18:14:49'),
(25, 8, 'Pierre, Shobe R..png', '1768115450287-Pierre__Shobe_R..png', '/uploads/avatars/1768115450287-Pierre__Shobe_R..png', 'image/png', 883476, 1, '2026-01-11 15:10:50'),
(26, 2, 'Gtr.jpg', '1768116021022-Gtr.jpg', '/uploads/avatars/1768116021022-Gtr.jpg', 'image/jpeg', 168502, 1, '2026-01-11 15:20:21');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activities`
--
ALTER TABLE `activities`
  ADD PRIMARY KEY (`activity_id`),
  ADD KEY `subject_id` (`subject_id`),
  ADD KEY `instructor_id` (`instructor_id`);

--
-- Indexes for table `activities_classwork`
--
ALTER TABLE `activities_classwork`
  ADD PRIMARY KEY (`id`),
  ADD KEY `activity_id` (`activity_id`),
  ADD KEY `uploaded_by` (`uploaded_by`);

--
-- Indexes for table `activity_items`
--
ALTER TABLE `activity_items`
  ADD PRIMARY KEY (`item_id`),
  ADD KEY `activity_id` (`activity_id`);

--
-- Indexes for table `activity_quiz_links`
--
ALTER TABLE `activity_quiz_links`
  ADD PRIMARY KEY (`link_id`),
  ADD UNIQUE KEY `activity_quiz_unique` (`activity_id`,`quiz_id`),
  ADD KEY `quiz_id` (`quiz_id`);

--
-- Indexes for table `activity_submissions`
--
ALTER TABLE `activity_submissions`
  ADD PRIMARY KEY (`submission_id`),
  ADD UNIQUE KEY `unique_submission` (`activity_id`,`student_id`),
  ADD KEY `idx_activity` (`activity_id`),
  ADD KEY `idx_student` (`student_id`);

--
-- Indexes for table `activity_submission_attachments`
--
ALTER TABLE `activity_submission_attachments`
  ADD PRIMARY KEY (`attachment_id`),
  ADD KEY `idx_submission` (`submission_id`);

--
-- Indexes for table `announcements`
--
ALTER TABLE `announcements`
  ADD PRIMARY KEY (`announcement_id`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_action` (`action`);

--
-- Indexes for table `dragdrop_attempts`
--
ALTER TABLE `dragdrop_attempts`
  ADD PRIMARY KEY (`attempt_id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `submission_id` (`submission_id`),
  ADD KEY `idx_activity_student` (`activity_id`,`student_id`),
  ADD KEY `idx_submitted_at` (`submitted_at`);

--
-- Indexes for table `dragdrop_scores`
--
ALTER TABLE `dragdrop_scores`
  ADD PRIMARY KEY (`score_id`),
  ADD UNIQUE KEY `unique_attempt` (`activity_id`,`student_id`,`component_type`),
  ADD KEY `student_id` (`student_id`);

--
-- Indexes for table `files`
--
ALTER TABLE `files`
  ADD PRIMARY KEY (`file_id`),
  ADD KEY `uploaded_by` (`uploaded_by`),
  ADD KEY `activity_id` (`activity_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`permission_id`);

--
-- Indexes for table `posting_teacher`
--
ALTER TABLE `posting_teacher`
  ADD PRIMARY KEY (`posting_id`),
  ADD KEY `announcement_id` (`announcement_id`);

--
-- Indexes for table `quizzes`
--
ALTER TABLE `quizzes`
  ADD PRIMARY KEY (`quiz_id`),
  ADD KEY `instructor_id` (`instructor_id`);

--
-- Indexes for table `quiz_answers`
--
ALTER TABLE `quiz_answers`
  ADD PRIMARY KEY (`answer_id`),
  ADD KEY `question_id` (`question_id`);

--
-- Indexes for table `quiz_attempts`
--
ALTER TABLE `quiz_attempts`
  ADD PRIMARY KEY (`attempt_id`),
  ADD KEY `quiz_id` (`quiz_id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `activity_id` (`activity_id`);

--
-- Indexes for table `quiz_attempt_answers`
--
ALTER TABLE `quiz_attempt_answers`
  ADD PRIMARY KEY (`attempt_answer_id`),
  ADD KEY `attempt_id` (`attempt_id`),
  ADD KEY `question_id` (`question_id`);

--
-- Indexes for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  ADD PRIMARY KEY (`question_id`),
  ADD KEY `quiz_id` (`quiz_id`);

--
-- Indexes for table `quiz_question_choices`
--
ALTER TABLE `quiz_question_choices`
  ADD PRIMARY KEY (`choice_id`),
  ADD KEY `question_id` (`question_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`role_id`);

--
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`role_permission_id`),
  ADD KEY `idx_role_id` (`role_id`),
  ADD KEY `idx_permission_id` (`permission_id`);

--
-- Indexes for table `student_scores`
--
ALTER TABLE `student_scores`
  ADD PRIMARY KEY (`score_id`),
  ADD UNIQUE KEY `quiz_student_unique` (`quiz_id`,`student_id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `activity_id` (`activity_id`),
  ADD KEY `best_attempt_id` (`best_attempt_id`);

--
-- Indexes for table `student_subjects`
--
ALTER TABLE `student_subjects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `subject_id` (`subject_id`);

--
-- Indexes for table `subjects`
--
ALTER TABLE `subjects`
  ADD PRIMARY KEY (`subject_id`),
  ADD UNIQUE KEY `class_code` (`class_code`),
  ADD KEY `instructor_id` (`instructor_id`);

--
-- Indexes for table `submissions`
--
ALTER TABLE `submissions`
  ADD PRIMARY KEY (`submission_id`),
  ADD KEY `activity_id` (`activity_id`),
  ADD KEY `student_id` (`student_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `role_id` (`role_id`);

--
-- Indexes for table `user_avatars`
--
ALTER TABLE `user_avatars`
  ADD PRIMARY KEY (`avatar_id`),
  ADD KEY `idx_user` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activities`
--
ALTER TABLE `activities`
  MODIFY `activity_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `activities_classwork`
--
ALTER TABLE `activities_classwork`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `activity_items`
--
ALTER TABLE `activity_items`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `activity_quiz_links`
--
ALTER TABLE `activity_quiz_links`
  MODIFY `link_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `activity_submissions`
--
ALTER TABLE `activity_submissions`
  MODIFY `submission_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `activity_submission_attachments`
--
ALTER TABLE `activity_submission_attachments`
  MODIFY `attachment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `announcements`
--
ALTER TABLE `announcements`
  MODIFY `announcement_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=78;

--
-- AUTO_INCREMENT for table `dragdrop_attempts`
--
ALTER TABLE `dragdrop_attempts`
  MODIFY `attempt_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `dragdrop_scores`
--
ALTER TABLE `dragdrop_scores`
  MODIFY `score_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `files`
--
ALTER TABLE `files`
  MODIFY `file_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=62;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `permission_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `posting_teacher`
--
ALTER TABLE `posting_teacher`
  MODIFY `posting_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `quizzes`
--
ALTER TABLE `quizzes`
  MODIFY `quiz_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `quiz_answers`
--
ALTER TABLE `quiz_answers`
  MODIFY `answer_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `quiz_attempts`
--
ALTER TABLE `quiz_attempts`
  MODIFY `attempt_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `quiz_attempt_answers`
--
ALTER TABLE `quiz_attempt_answers`
  MODIFY `attempt_answer_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  MODIFY `question_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `quiz_question_choices`
--
ALTER TABLE `quiz_question_choices`
  MODIFY `choice_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `role_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `role_permissions`
--
ALTER TABLE `role_permissions`
  MODIFY `role_permission_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `student_scores`
--
ALTER TABLE `student_scores`
  MODIFY `score_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `student_subjects`
--
ALTER TABLE `student_subjects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `subjects`
--
ALTER TABLE `subjects`
  MODIFY `subject_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `submissions`
--
ALTER TABLE `submissions`
  MODIFY `submission_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `user_avatars`
--
ALTER TABLE `user_avatars`
  MODIFY `avatar_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activities`
--
ALTER TABLE `activities`
  ADD CONSTRAINT `fk_instructor` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`) ON DELETE CASCADE;

--
-- Constraints for table `activities_classwork`
--
ALTER TABLE `activities_classwork`
  ADD CONSTRAINT `activities_classwork_ibfk_1` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`activity_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `activities_classwork_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `activity_items`
--
ALTER TABLE `activity_items`
  ADD CONSTRAINT `activity_items_ibfk_1` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`activity_id`) ON DELETE CASCADE;

--
-- Constraints for table `activity_quiz_links`
--
ALTER TABLE `activity_quiz_links`
  ADD CONSTRAINT `fk_activity_quiz_links_activity` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`activity_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_activity_quiz_links_quiz` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`quiz_id`) ON DELETE CASCADE;

--
-- Constraints for table `activity_submissions`
--
ALTER TABLE `activity_submissions`
  ADD CONSTRAINT `activity_submissions_ibfk_1` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`activity_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `activity_submissions_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `activity_submission_attachments`
--
ALTER TABLE `activity_submission_attachments`
  ADD CONSTRAINT `activity_submission_attachments_ibfk_1` FOREIGN KEY (`submission_id`) REFERENCES `activity_submissions` (`submission_id`) ON DELETE CASCADE;

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `fk_audit_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `dragdrop_attempts`
--
ALTER TABLE `dragdrop_attempts`
  ADD CONSTRAINT `dragdrop_attempts_ibfk_1` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`activity_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `dragdrop_attempts_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `dragdrop_attempts_ibfk_3` FOREIGN KEY (`submission_id`) REFERENCES `activity_submissions` (`submission_id`) ON DELETE SET NULL;

--
-- Constraints for table `dragdrop_scores`
--
ALTER TABLE `dragdrop_scores`
  ADD CONSTRAINT `dragdrop_scores_ibfk_1` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`activity_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `dragdrop_scores_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `files`
--
ALTER TABLE `files`
  ADD CONSTRAINT `files_ibfk_1` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `files_ibfk_2` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`activity_id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `posting_teacher`
--
ALTER TABLE `posting_teacher`
  ADD CONSTRAINT `fk_posting_teacher_announcement` FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`announcement_id`) ON DELETE CASCADE;

--
-- Constraints for table `quizzes`
--
ALTER TABLE `quizzes`
  ADD CONSTRAINT `fk_quizzes_instructor` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `quiz_answers`
--
ALTER TABLE `quiz_answers`
  ADD CONSTRAINT `fk_quiz_answers_question` FOREIGN KEY (`question_id`) REFERENCES `quiz_questions` (`question_id`) ON DELETE CASCADE;

--
-- Constraints for table `quiz_attempts`
--
ALTER TABLE `quiz_attempts`
  ADD CONSTRAINT `fk_quiz_attempts_activity` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`activity_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_quiz_attempts_quiz` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`quiz_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_quiz_attempts_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `quiz_attempt_answers`
--
ALTER TABLE `quiz_attempt_answers`
  ADD CONSTRAINT `fk_quiz_attempt_answers_attempt` FOREIGN KEY (`attempt_id`) REFERENCES `quiz_attempts` (`attempt_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_quiz_attempt_answers_question` FOREIGN KEY (`question_id`) REFERENCES `quiz_questions` (`question_id`) ON DELETE CASCADE;

--
-- Constraints for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  ADD CONSTRAINT `fk_quiz_questions_quiz` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`quiz_id`) ON DELETE CASCADE;

--
-- Constraints for table `quiz_question_choices`
--
ALTER TABLE `quiz_question_choices`
  ADD CONSTRAINT `fk_quiz_question_choices_question` FOREIGN KEY (`question_id`) REFERENCES `quiz_questions` (`question_id`) ON DELETE CASCADE;

--
-- Constraints for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `fk_role_permissions_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`permission_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE CASCADE;

--
-- Constraints for table `student_scores`
--
ALTER TABLE `student_scores`
  ADD CONSTRAINT `fk_student_scores_activity` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`activity_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_student_scores_attempt` FOREIGN KEY (`best_attempt_id`) REFERENCES `quiz_attempts` (`attempt_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_student_scores_quiz` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`quiz_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_student_scores_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `student_subjects`
--
ALTER TABLE `student_subjects`
  ADD CONSTRAINT `student_subjects_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_subjects_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`) ON DELETE CASCADE;

--
-- Constraints for table `subjects`
--
ALTER TABLE `subjects`
  ADD CONSTRAINT `subjects_ibfk_1` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `submissions`
--
ALTER TABLE `submissions`
  ADD CONSTRAINT `submissions_ibfk_1` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`activity_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `submissions_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `user_avatars`
--
ALTER TABLE `user_avatars`
  ADD CONSTRAINT `user_avatars_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
