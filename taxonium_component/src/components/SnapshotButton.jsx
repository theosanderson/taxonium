import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { BiCamera } from 'react-icons/bi';
import TaxButton from './TaxButton';

const SnapshotButton = ({svgFunction, pixelFunction, deckSize}) => {
  const [isOpen, setIsOpen] = useState(false);

  function snapshot(option) {
    if (option === 'pixels') {
      pixelFunction();
    } else if (option === 'SVG') {
      svgFunction(deckSize);
    }
    setIsOpen(false);
  }

  return (
    <>
      <TaxButton
        onClick={() => setIsOpen(true)}
        title="Take screenshot"
      >
        <BiCamera className="mx-auto w-5 h-5 inline-block" />
      </TaxButton>

      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" static className="fixed inset-0 z-10 overflow-y-auto" open={isOpen} onClose={setIsOpen}>
          <div className="min-h-screen px-4 text-center">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
            
            <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                Choose format
              </Dialog.Title>
              
              <div className="mt-4">
                <button onClick={() => snapshot('pixels')} className="text-blue-600 hover:text-blue-800">
                  Pixels
                </button>
                <button onClick={() => snapshot('SVG')} className="ml-4 text-blue-600 hover:text-blue-800">
                  SVG
                </button>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}

export default SnapshotButton;