CREATE TABLE `roles` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `role_name` varchar(255),
  `created_at` datetime
);

CREATE TABLE `users` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255),
  `email` varchar(255) UNIQUE,
  `password` varchar(255),
  `role_id` int,
  `created_at` datetime
);

CREATE TABLE `rooms` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `room_name` varchar(255),
  `capacity` int,
  `location` varchar(255),
  `created_at` datetime
);

CREATE TABLE `bookings` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `user_id` int,
  `room_id` int,
  `meeting_date` date,
  `start_time` time,
  `end_time` time,
  `agenda` varchar(255),
  `status` varchar(255),
  `created_at` datetime
);

ALTER TABLE `users` ADD FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);

ALTER TABLE `bookings` ADD FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `bookings` ADD FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`);
