import Link from "next/link";
import React from "react";

function Navbar() {
  return (
    <div className="fixed inset-x-0 top-0 bg-slate-100  z-[10] h-fit  py-4 ">
      <div className="flex items-center justify-between h-full gap-2 px-8 mx-auto">
        <div className="flex flex-row gap-3 justify-center">
          <Link href={"/dashboard"} className="flex items-center gap-2">
            <p className="px-2 py-1 text-2xl font-bold text-black">
              Folo<span className="text-indigo-600">Up</span>{" "}
              <span className="text-[8px]">Beta</span>
            </p>
          </Link>
          <p className="my-auto text-xl">/</p>
          <div className="my-auto">
            <span className="text-sm font-semibold text-gray-700">Default Workspace</span>
          </div>
        </div>
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
            U
          </div>
        </div>
      </div>
    </div>
  );
}

export default Navbar;
