export async function up(pgm: any): Promise<void> {
  pgm.addColumn("users", { password_hash: { type: "text", notNull: false } });
}

export async function down(pgm: any): Promise<void> {
  pgm.dropColumn("users", "password_hash");
}
