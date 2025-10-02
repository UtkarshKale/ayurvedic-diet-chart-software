CREATE TABLE `compliance_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`patient_id` integer,
	`diet_chart_id` integer,
	`date` text,
	`compliance_percentage` integer,
	`meals_followed` integer,
	`meals_total` integer,
	`notes` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`diet_chart_id`) REFERENCES `diet_charts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `diet_charts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`patient_id` integer,
	`duration` integer,
	`target_calories` integer,
	`dietary_focus` text,
	`special_instructions` text,
	`total_calories` real,
	`total_protein` real,
	`total_carbs` real,
	`total_fat` real,
	`dosha_balance_score` integer,
	`rasa_score` integer,
	`digestibility_score` integer,
	`status` text DEFAULT 'Active' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `meal_foods` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`meal_id` integer,
	`food_name` text,
	`quantity` real,
	`unit` text,
	`calories` real,
	`protein` real,
	`carbs` real,
	`fat` real,
	`thermal_property` text,
	`digestibility` text,
	`rasa` text,
	`dosha_effect` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`meal_id`) REFERENCES `meals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `meals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`diet_chart_id` integer,
	`meal_type` text,
	`meal_time` text,
	`total_calories` real,
	`total_protein` real,
	`total_carbs` real,
	`total_fat` real,
	`created_at` text NOT NULL,
	FOREIGN KEY (`diet_chart_id`) REFERENCES `diet_charts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `patients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`age` integer NOT NULL,
	`gender` text NOT NULL,
	`dosha` text NOT NULL,
	`phone` text,
	`email` text,
	`height` real,
	`weight` real,
	`bmi` real,
	`dietary_habits` text,
	`meal_frequency` integer,
	`water_intake` real,
	`health_conditions` text,
	`allergies` text,
	`notes` text,
	`status` text DEFAULT 'Active' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profile_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`first_name` text,
	`last_name` text,
	`email` text,
	`phone` text,
	`specialization` text,
	`clinic_name` text,
	`updated_at` text NOT NULL
);
