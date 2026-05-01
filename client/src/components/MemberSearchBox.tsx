import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X } from "lucide-react";

interface MemberSearchBoxProps {
  onMemberSelect?: (member: any) => void;
  onAdhesionSelect?: (adhesion: any) => void;
  placeholder?: string;
}

export function MemberSearchBox({ 
  onMemberSelect, 
  onAdhesionSelect,
  placeholder = "Rechercher par ID (MEM-...) ou nom..."
}: MemberSearchBoxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const searchQuery = trpc.search.searchMembers.useQuery(
    { query },
    { enabled: query.length > 0 }
  );

  useEffect(() => {
    if (searchQuery.data) {
      setResults(searchQuery.data);
      setIsOpen(true);
    }
  }, [searchQuery.data]);

  const handleSelect = (member: any) => {
    if (onMemberSelect) {
      onMemberSelect(member);
    }
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            className="pl-10"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="absolute right-1 top-1/2 transform -translate-y-1/2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {isOpen && results.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg">
          <CardContent className="p-0">
            <div className="max-h-64 overflow-y-auto">
              {results.map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleSelect(member)}
                  className="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b last:border-b-0"
                >
                  <div className="font-medium">{member.firstName} {member.lastName}</div>
                  <div className="text-sm text-muted-foreground">
                    ID: {member.memberId}
                  </div>
                  {member.email && (
                    <div className="text-sm text-muted-foreground">
                      {member.email}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isOpen && results.length === 0 && query.length > 0 && !searchQuery.isLoading && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg">
          <CardContent className="p-4 text-center text-muted-foreground">
            Aucun résultat trouvé pour "{query}"
          </CardContent>
        </Card>
      )}

      {searchQuery.isLoading && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg">
          <CardContent className="p-4 text-center text-muted-foreground">
            Recherche en cours...
          </CardContent>
        </Card>
      )}
    </div>
  );
}
