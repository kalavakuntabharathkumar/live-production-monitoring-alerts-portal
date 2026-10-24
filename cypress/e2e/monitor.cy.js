describe("LineWatch production monitor", () => {
  beforeEach(() => cy.visit("/"));

  it("shows the live dashboard and eight production lines", () => {
    cy.contains("Production overview").should("be.visible");
    cy.get(".line-card", { timeout: 8000 }).should("have.length", 8);
    cy.get("#total-output").should("not.contain", "—");
  });

  it("filters lines by search text", () => {
    cy.get("#line-search").type("LINE-01");
    cy.get(".line-card").should("have.length", 1);
    cy.get(".line-name").should("contain", "Production line 1");
  });

  it("filters lines by status", () => {
    cy.get("#status-filter").select("warning");
    cy.get(".line-card").should("have.length.greaterThan", 0);
    cy.get(".line-card").each(($card) => cy.wrap($card).should("have.attr", "data-status", "warning"));
  });

  it("switches between supervisor and operator view labels", () => {
    cy.get("#role-toggle").click();
    cy.get("#role-toggle").should("contain", "Operator");
    cy.get(".line-card").first().should("contain", "Operator view");
  });
});
