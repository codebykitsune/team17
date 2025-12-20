import { Link } from "react-router-dom";
import AnswersView from "../components/AnswersView.tsx";
import { Button } from "../components/ui/button.tsx";
import { Input } from "../components/ui/input.tsx";

export default function Part() {
  return (
    <div className="w-full px-4 max-w-screen-lg mx-auto">
      <div className="p-12 max-w-xl m-auto mt-16">
        <Input placeholder="ニックネームを入力" />
        <Link to="/admin">
          <Button className="w-1/2 mt-4 max-w-50 flex mx-auto mb-12">予定の入力に進む</Button>
        </Link>
      </div>
      <AnswersView />
    </div>
  );
}
