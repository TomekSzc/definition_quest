import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CheckIcon, XIcon, EditIcon } from "@/assets/icons";

interface Props {
  value: string;
  onSave: (title: string) => void;
}

const BoardTitleInput: React.FC<Props> = ({ value, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleConfirm = () => {
    if (draft.trim().length === 0 || draft.length > 255) return;
    onSave(draft.trim());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(value);
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-2">
      {isEditing ? (
        <>
          <input
            className="flex-1 px-3 py-1 border rounded"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={255}
          />
          <Button size="icon" variant="ghost" onClick={handleConfirm}>
            <CheckIcon className="w-5 h-5 text-green-600" />
          </Button>
          <Button size="icon" variant="ghost" onClick={handleCancel}>
            <XIcon className="w-5 h-5 text-red-600" />
          </Button>
        </>
      ) : (
        <>
          <h2 className="text-xl font-bold flex-1 break-words">{value}</h2>
          <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)}>
            <EditIcon className="w-5 h-5" />
          </Button>
        </>
      )}
    </div>
  );
};

export default BoardTitleInput;
