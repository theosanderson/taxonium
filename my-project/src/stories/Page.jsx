import React from "react";

import { Header } from "./Header";
import "./page.css";
import TaxoniumWrapper from "../TaxoniumWrapper";

export const Page = () => {
  const [user, setUser] = React.useState();

  return (
    <article>
      <Header
        user={user}
        onLogin={() => setUser({ name: "Jane Doe" })}
        onLogout={() => setUser(undefined)}
        onCreateAccount={() => setUser({ name: "Jane Doe" })}
      />

      <section>
        <TaxoniumWrapper />
      </section>
    </article>
  );
};
