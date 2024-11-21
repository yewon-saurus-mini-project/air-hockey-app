import { NextPage } from "next";
import { useRouter } from "next/router";

import { Button } from "../components/Button";

const Room: NextPage<{}> = () => {
    const router = useRouter();
    const {id, isHost} = router.query;

    return (
        <>
            <div className='absolute left-3 top-3 z-10'>
                {
                    isHost === 'true'
                    ?
                    <Button name={'나가기'} onClick={() => {router.back()}} />
                    :
                    <div className="text-center">
                        <div>Black : White</div>
                        <div>0 : 0</div>
                    </div>
                }
            </div>
            <div>
                <div className="bg-red-100 h-[399px]">
                    {/* TODO */}
                </div>
                <div className="bg-blue-100 h-[399px]">
                    {/* TODO */}
                </div>
            </div>
        </>
    );
}

export default Room;