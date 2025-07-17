import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, SlidersHorizontal, MapPin, ChevronDown } from 'lucide-react';
import { SearchFilters } from '@/lib/types';

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  isLoading?: boolean;
}

export default function SearchFiltersComponent({ 
  filters, 
  onFiltersChange, 
  onSearch, 
  isLoading = false 
}: SearchFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const specialties = [
    { value: 'cardiology', label: 'Cardiology' },
    { value: 'dermatology', label: 'Dermatology' },
    { value: 'neurology', label: 'Neurology' },
    { value: 'pediatrics', label: 'Pediatrics' },
    { value: 'orthopedics', label: 'Orthopedics' },
    { value: 'gynecology', label: 'Gynecology' },
    { value: 'psychiatry', label: 'Psychiatry' },
    { value: 'oncology', label: 'Oncology' },
    { value: 'general', label: 'General Practice' },
  ];

  const insurances = [
    { value: 'aetna', label: 'Aetna' },
    { value: 'bluecross', label: 'Blue Cross Blue Shield' },
    { value: 'cigna', label: 'Cigna' },
    { value: 'humana', label: 'Humana' },
    { value: 'medicare', label: 'Medicare' },
    { value: 'medicaid', label: 'Medicaid' },
    { value: 'unitedhealthcare', label: 'UnitedHealthcare' },
  ];

  const availabilityOptions = [
    { value: 'today', label: 'Today' },
    { value: 'tomorrow', label: 'Tomorrow' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
  ];

  const languages = [
    { value: 'english', label: 'English' },
    { value: 'spanish', label: 'Spanish' },
    { value: 'french', label: 'French' },
    { value: 'chinese', label: 'Chinese' },
    { value: 'arabic', label: 'Arabic' },
  ];

  const services = [
    { value: 'telemedicine', label: 'Telemedicine' },
    { value: 'video_consult', label: 'Video Consultation' },
    { value: 'same_day', label: 'Same Day Appointments' },
    { value: 'weekend', label: 'Weekend Availability' },
  ];

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleServiceChange = (service: string, checked: boolean) => {
    const currentServices = filters.services || [];
    const newServices = checked
      ? [...currentServices, service]
      : currentServices.filter(s => s !== service);
    
    handleFilterChange('services', newServices);
  };

  return (
    <Card className="bg-primary-50 dark:bg-gray-800 border-primary-100 dark:border-gray-700">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-gray-900 dark:text-white">
            Find Your Doctor
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-primary hover:text-primary/80"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Advanced Search
            <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Search Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="specialty" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Specialty
            </Label>
            <Select value={filters.specialty} onValueChange={(value) => handleFilterChange('specialty', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="All Specialties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specialties</SelectItem>
                {specialties.map((specialty) => (
                  <SelectItem key={specialty.value} value={specialty.value}>
                    {specialty.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="location" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Location
            </Label>
            <div className="relative mt-1">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="location"
                placeholder="City or ZIP code"
                value={filters.location || ''}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="insurance" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Insurance
            </Label>
            <Select value={filters.insurance} onValueChange={(value) => handleFilterChange('insurance', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="All Insurance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Insurance</SelectItem>
                {insurances.map((insurance) => (
                  <SelectItem key={insurance.value} value={insurance.value}>
                    {insurance.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="availability" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Availability
            </Label>
            <Select value={filters.availability} onValueChange={(value) => handleFilterChange('availability', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Any Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any Time</SelectItem>
                {availabilityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Search Panel */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleContent className="space-y-6 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                  Gender Preference
                </Label>
                <RadioGroup
                  value={filters.gender || 'any'}
                  onValueChange={(value) => handleFilterChange('gender', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="any" id="any" />
                    <Label htmlFor="any" className="text-sm">Any</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male" className="text-sm">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female" className="text-sm">Female</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="language" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Language
                </Label>
                <Select value={filters.language} onValueChange={(value) => handleFilterChange('language', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Any Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Language</SelectItem>
                    {languages.map((language) => (
                      <SelectItem key={language.value} value={language.value}>
                        {language.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="rating" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Minimum Rating
                </Label>
                <Select value={filters.rating?.toString()} onValueChange={(value) => handleFilterChange('rating', value ? parseFloat(value) : undefined)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Any Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Rating</SelectItem>
                    <SelectItem value="4">4+ Stars</SelectItem>
                    <SelectItem value="4.5">4.5+ Stars</SelectItem>
                    <SelectItem value="4.8">4.8+ Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                  Services
                </Label>
                <div className="grid grid-cols-1 gap-3">
                  {services.map((service) => (
                    <div key={service.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={service.value}
                        checked={filters.services?.includes(service.value) || false}
                        onCheckedChange={(checked) => handleServiceChange(service.value, checked as boolean)}
                      />
                      <Label htmlFor={service.value} className="text-sm">
                        {service.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                  Price Range
                </Label>
                <RadioGroup
                  value={filters.priceRange || 'any'}
                  onValueChange={(value) => handleFilterChange('priceRange', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="any" id="price-any" />
                    <Label htmlFor="price-any" className="text-sm">Any Price</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="price-low" />
                    <Label htmlFor="price-low" className="text-sm">Under $200</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mid" id="price-mid" />
                    <Label htmlFor="price-mid" className="text-sm">$200-$400</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="price-high" />
                    <Label htmlFor="price-high" className="text-sm">$400+</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Search Button */}
        <Button 
          className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-3"
          onClick={onSearch}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="loading-spinner mr-2" />
          ) : (
            <Search className="h-4 w-4 mr-2" />
          )}
          Search Doctors
        </Button>
      </CardContent>
    </Card>
  );
}
