import { type FC, useRef } from "react";
import { withProviders } from "@/components/HOC/Providers";
import CreateBoardForm, { type CreateBoardFormHandle } from "@/components/forms/CreateBoardForm";
import LoaderOverlay from "@/components/ui/LoaderOverlay";
import GeneratePairsByAI from "@/components/forms/GeneratePairsByAI";
import { useCreateBoardMutation } from "@/store/api/apiSlice";

/**
 * Page component rendered inside create.astro island.
 * Handles layout offsets and groups form + AI panel.
 */
const CreateBoardPageComponent: FC = () => {
  const [createBoard] = useCreateBoardMutation();
  const formRef = useRef<CreateBoardFormHandle>(null);

  return (
    <div className="flex flex-wrap justify-start p-4 gap-8 bg-secondary relative min-h-[85vh] md:pl-[80px]">
      <LoaderOverlay />
      <div className="flex-1 min-w-[320px] max-w-3xl">
        <CreateBoardForm ref={formRef} submitFn={createBoard} />
      </div>

      <div className="w-full md:w-80 lg:w-96 sticky top-20 self-start">
        <GeneratePairsByAI formRef={formRef} />
      </div>
    </div>
  );
};
export const CreateBoardPage = withProviders(CreateBoardPageComponent);

export default CreateBoardPage;
