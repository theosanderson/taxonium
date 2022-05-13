import {useState, useMemo, useCallback} from 'react';
export const useSettings = ({query,updateQuery})=> {
    const [minimapEnabled, setMinimapEnabled] = useState(true);
    const toggleMinimapEnabled = () => {
        setMinimapEnabled(!minimapEnabled);
    }

    const mutationTypesEnabled = useMemo(() => {
        return JSON.parse(query.mutationTypesEnabled);
      }, [query.mutationTypesEnabled]);
    
      const filterMutations = useCallback(
        (mutations) => {
          return mutations.filter(
            (mutation) => mutationTypesEnabled[mutation.type]
          );
        },
        [mutationTypesEnabled]
      );
    
      const setMutationTypeEnabled = (key, enabled) => {
        const newMutationTypesEnabled = { ...mutationTypesEnabled };
        newMutationTypesEnabled[key] = enabled;
        updateQuery({
          mutationTypesEnabled: JSON.stringify(newMutationTypesEnabled),
        });
      };

    return {minimapEnabled, toggleMinimapEnabled, mutationTypesEnabled, filterMutations, setMutationTypeEnabled};





};
       