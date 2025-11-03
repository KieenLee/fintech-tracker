using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace fintechtracker_backend.Migrations
{
    /// <inheritdoc />
    public partial class AddTelegramMessageIdToTelegramMessages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "TelegramMessages",
                keyColumn: "MessageText",
                keyValue: null,
                column: "MessageText",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "MessageText",
                table: "TelegramMessages",
                type: "longtext",
                nullable: false,
                collation: "utf8mb4_0900_ai_ci",
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("Relational:Collation", "utf8mb4_0900_ai_ci");

            migrationBuilder.AddColumn<int>(
                name: "TelegramMessageId",
                table: "TelegramMessages",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TelegramMessageId",
                table: "TelegramMessages");

            migrationBuilder.AlterColumn<string>(
                name: "MessageText",
                table: "TelegramMessages",
                type: "longtext",
                nullable: true,
                collation: "utf8mb4_0900_ai_ci",
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("Relational:Collation", "utf8mb4_0900_ai_ci");
        }
    }
}
