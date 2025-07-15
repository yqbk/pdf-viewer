"use client";

import styled from "styled-components";

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

export default function HomeContent() {
  return (
    <Page>
      <Main>
        <p>main</p>
      </Main>
    </Page>
  );
}
