import React, { useState, Fragment } from "react";
import {
  Dialog,
  Transition,
  DialogBackdrop,
  DialogPanel,
} from "@headlessui/react";
import { BiCamera } from "react-icons/bi";
import TaxButton from "./TaxButton";
import type { DeckSize } from "../types/common";

interface SnapshotButtonProps {
  svgFunction: (size: DeckSize) => void;
  pixelFunction: () => void;
  deckSize: DeckSize;
}

const SnapshotButton = ({ svgFunction, pixelFunction, deckSize }: SnapshotButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  function snapshot(option: "pixels" | "SVG") {
    if (option === "pixels") {
      pixelFunction();
    } else if (option === "SVG") {
      svgFunction(deckSize);
    }
    setIsOpen(false);
  }

  return (
    <>
      <TaxButton onClick={() => setIsOpen(true)} title="Take screenshot">
        <BiCamera className="mx-auto w-5 h-5 inline-block" />
      </TaxButton>

      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          static
          className="fixed inset-0 z-10 overflow-y-auto taxonium"
          open={isOpen}
          onClose={setIsOpen}
        >
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <DialogBackdrop className="fixed inset-0 -z-10 bg-black opacity-30" />
            
            <div className="min-h-screen px-4 text-center flex items-center justify-center">
              <span
                className="inline-block h-screen align-middle"
                aria-hidden="true"
              >
                &#8203;
              </span>
              
              <DialogPanel className="w-full max-w-md p-6 overflow-hidden text-left align-middle bg-white shadow-xl rounded-2xl">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Choose format
                </Dialog.Title>

                <div className="mt-4">
                  <button
                    onClick={() => snapshot("SVG")}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    SVG (vector)
                  </button>
                  <button
                    onClick={() => snapshot("pixels")}
                    className="ml-4 text-blue-600 hover:text-blue-800"
                  >
                    PNG
                  </button>
                </div>
              </DialogPanel>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};

export default SnapshotButton;