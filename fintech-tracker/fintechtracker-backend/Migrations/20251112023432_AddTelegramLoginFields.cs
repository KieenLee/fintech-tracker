using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace fintechtracker_backend.Migrations
{
    /// <inheritdoc />
    public partial class AddTelegramLoginFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TelegramFirstName",
                table: "users",
                type: "longtext",
                nullable: true,
                collation: "utf8mb4_0900_ai_ci")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "TelegramLastName",
                table: "users",
                type: "longtext",
                nullable: true,
                collation: "utf8mb4_0900_ai_ci")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "TelegramLinkedAt",
                table: "users",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TelegramPhotoUrl",
                table: "users",
                type: "longtext",
                nullable: true,
                collation: "utf8mb4_0900_ai_ci")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "TelegramUsername",
                table: "users",
                type: "longtext",
                nullable: true,
                collation: "utf8mb4_0900_ai_ci")
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TelegramFirstName",
                table: "users");

            migrationBuilder.DropColumn(
                name: "TelegramLastName",
                table: "users");

            migrationBuilder.DropColumn(
                name: "TelegramLinkedAt",
                table: "users");

            migrationBuilder.DropColumn(
                name: "TelegramPhotoUrl",
                table: "users");

            migrationBuilder.DropColumn(
                name: "TelegramUsername",
                table: "users");
        }
    }
}
