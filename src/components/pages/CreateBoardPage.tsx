import React from "react";
import { withProviders } from "@/components/HOC/Providers";
import CreateBoardForm, { type CreateBoardFormHandle } from "@/components/forms/CreateBoardForm";
import GeneratePairsByAI from "@/components/forms/GeneratePairsByAI";

/**
 * Page component rendered inside create.astro island.
 * Handles layout offsets and groups form + AI panel.
 */
const CreateBoardPageComponent: React.FC = () => {
  const formRef = React.useRef<CreateBoardFormHandle>(null);

  return (
    <div className="flex flex-wrap ml-64 p-4 gap-8">
      <div className="flex-1 min-w-[320px] max-w-3xl">
        <CreateBoardForm ref={formRef} />
      </div>

      <div className="w-full md:w-80 lg:w-96 sticky top-20 self-start">
        <GeneratePairsByAI formRef={formRef} />
      </div>
    </div>
  );
};
export const CreateBoardPage = withProviders(CreateBoardPageComponent);

export default CreateBoardPage;
