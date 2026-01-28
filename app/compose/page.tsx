'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Image as ImageIcon, Video, Smile, MapPin, Calendar, BarChart3, X, Search, Clock, Plus } from 'lucide-react';
import { composeTrend } from '@/lib/api';

export default function ComposePage() {
  const router = useRouter();
  const [trendText, setTrendText] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // Store original File objects for upload
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState('');
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollDuration, setPollDuration] = useState('1');
  const [hasPoll, setHasPoll] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const gifPickerRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const scheduleRef = useRef<HTMLDivElement>(null);

  // Popular GIFs (simulated)
  const popularGifs = [
    { id: 1, url: 'https://media.giphy.com/media/3o7aCTPPm4OHfRLSH6/giphy.gif', title: 'Happy' },
    { id: 2, url: 'https://media.giphy.com/media/l0MYC0Laj6Po2f5Kw/giphy.gif', title: 'Excited' },
    { id: 3, url: 'https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif', title: 'Dancing' },
    { id: 4, url: 'https://media.giphy.com/media/3o7abldet0lRJPcpSo/giphy.gif', title: 'Celebrate' },
    { id: 5, url: 'https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif', title: 'Thumbs Up' },
    { id: 6, url: 'https://media.giphy.com/media/3o7aD2sa0qmm3lq8G4/giphy.gif', title: 'Love' },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        if (file.type.startsWith('image/')) {
          // Check file size (10MB limit for images)
          if (file.size > 10 * 1024 * 1024) {
            alert(`Image "${file.name}" is too large. Maximum size is 10MB.`);
            return;
          }
          
          // Limit to 4 images
          if (selectedMedia.filter(m => m.startsWith('data:image/') || m.startsWith('http')).length >= 4) {
            alert('Maximum 4 images allowed');
            return;
          }
          
          // Store the original file
          setSelectedFiles((prev) => [...prev, file]);
          
          const reader = new FileReader();
          reader.onloadend = () => {
            setSelectedMedia((prev) => [...prev, reader.result as string]);
          };
          reader.onerror = () => {
            alert(`Failed to load image "${file.name}"`);
          };
          reader.readAsDataURL(file);
        } else {
          alert(`"${file.name}" is not a valid image file`);
        }
      });
    }
    // Reset input to allow selecting the same file again
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith('video/')) {
        // Check file size (50MB limit for videos)
        if (file.size > 50 * 1024 * 1024) {
          alert(`Video "${file.name}" is too large. Maximum size is 50MB.`);
          return;
        }
        
        // Only allow one video
        const hasVideo = selectedMedia.some(m => m.startsWith('data:video/'));
        if (hasVideo) {
          alert('Only one video is allowed per post. Please remove the existing video first.');
          return;
        }
        
        // Store the original file
        setSelectedFiles((prev) => [...prev, file]);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedMedia((prev) => [...prev, reader.result as string]);
        };
        reader.onerror = () => {
          alert(`Failed to load video "${file.name}"`);
        };
        reader.readAsDataURL(file);
      } else {
        alert(`"${file.name}" is not a valid video file`);
      }
    }
    // Reset input to allow selecting the same file again
    if (e.target) {
      e.target.value = '';
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGifSelect = (gifUrl: string) => {
    setSelectedMedia((prev) => [...prev, gifUrl]);
    // GIFs are URLs, not files, so we don't add to selectedFiles
    setShowGifPicker(false);
  };

  const addPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const popularLocations = [
    'New York, NY',
    'Los Angeles, CA',
    'Chicago, IL',
    'Houston, TX',
    'Phoenix, AZ',
    'Philadelphia, PA',
    'San Antonio, TX',
    'San Diego, CA',
    'Dallas, TX',
    'San Jose, CA',
    'Austin, TX',
    'Jacksonville, FL',
    'Fort Worth, TX',
    'Columbus, OH',
    'Charlotte, NC',
    'San Francisco, CA',
    'Indianapolis, IN',
    'Seattle, WA',
    'Denver, CO',
    'Washington, DC',
    'Boston, MA',
    'El Paso, TX',
    'Nashville, TN',
    'Detroit, MI',
    'Oklahoma City, OK',
    'Portland, OR',
    'Las Vegas, NV',
    'Memphis, TN',
    'Louisville, KY',
    'Baltimore, MD',
    'Milwaukee, WI',
    'Albuquerque, NM',
    'Tucson, AZ',
    'Fresno, CA',
    'Sacramento, CA',
    'Kansas City, MO',
    'Mesa, AZ',
    'Atlanta, GA',
    'Omaha, NE',
    'Raleigh, NC',
    'Miami, FL',
    'Oakland, CA',
    'Minneapolis, MN',
    'Tulsa, OK',
    'Cleveland, OH',
    'Wichita, KS',
    'Arlington, TX',
    'New Orleans, LA',
    'London, UK',
    'Paris, France',
    'Tokyo, Japan',
    'Sydney, Australia',
    'Toronto, Canada',
    'Berlin, Germany',
    'Madrid, Spain',
    'Rome, Italy',
    'Amsterdam, Netherlands',
    'Dubai, UAE',
    'Singapore',
    'Hong Kong',
    'Bangkok, Thailand',
    'Mumbai, India',
    'São Paulo, Brazil',
    'Mexico City, Mexico',
    'Buenos Aires, Argentina',
    'Cairo, Egypt',
    'Lagos, Nigeria',
    'Johannesburg, South Africa',
  ];

  // Filter locations based on search query
  const filteredLocations = popularLocations.filter(location =>
    location.toLowerCase().includes(locationSearch.toLowerCase())
  );

  // Comprehensive emoji categories with extensive emoji list
  const emojiCategories = {
    'Frequently Used': ['😀', '😂', '❤️', '🔥', '👍', '🎉', '😍', '✨', '💯', '🙌', '😊', '🥰', '😎', '🤔', '😭', '😱', '🤯', '💪', '👏', '🎊'],
    'Smileys & People': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😶‍🌫️', '😵', '😵‍💫', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'],
    'Animals & Nature': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🪶', '🐓', '🦃', '🦤', '🦚', '🦜', '🦢', '🦩', '🕊', '🐇', '🦝', '🦨', '🦡', '🦫', '🦦', '🦥', '🐁', '🐀', '🐿', '🦔', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🌍', '🌎', '🌏', '🌐', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌙', '🌚', '🌛', '🌜', '🌝', '🌞', '⭐', '🌟', '💫', '✨', '☄️', '💥', '🔥', '🌈', '☀️', '⛅', '☁️', '⛈️', '🌤️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '💧', '💦', '☔', '☂️', '🌊', '🌫️'],
    'Food & Drink': ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🌽', '🥕', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🥞', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🌮', '🌯', '🥗', '🥘', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '🫖', '☕', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊'],
    'Travel & Places': ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛴', '🚲', '🛵', '🏍', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🚁', '🚟', '🚠', '🚡', '🛰️', '🚀', '🛸', '🛎️', '🧳', '⌛', '⏳', '⌚', '⏰', '⏱️', '⏲️', '🕛', '🕧', '🕐', '🕜', '🕑', '🕝', '🕒', '🕞', '🕓', '🕟', '🕔', '🕠', '🕕', '🕡', '🕖', '🕢', '🕗', '🕣', '🕘', '🕤', '🕙', '🕥', '🕚', '🕦', '🌍', '🌎', '🌏', '🌐', '🗺️', '🧭', '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️', '🏟️', '🏛️', '🏗️', '🧱', '🏘️', '🏚️', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '💒', '🗼', '🗽', '⛪', '🕌', '🛕', '🕍', '⛩️', '🕋', '⛲', '⛺', '🌁', '🌃', '🏙️', '🌄', '🌅', '🌆', '🌇', '🌉', '♨️', '🎠', '🎡', '🎢', '💈', '🎪', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊', '🚝', '🚞', '🚟', '🚠', '🚡', '🚀', '🛸'],
    'Activities': ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥅', '🏒', '🏑', '🏏', '🥃', '🏹', '🎣', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸', '🥌', '🎿', '⛷', '🏂', '🏋️', '🤼', '🤸', '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰', '🧩'],
    'Objects': ['⌚', '📱', '📲', '💻', '⌨️', '🖥', '🖨', '🖱', '🖲', '🕹', '🗜', '💾', '💿', '📷', '📸', '📹', '🎥', '📽', '🎞', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙', '🎚', '🎛', '⏱', '⏲', '⏰', '🕰️', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '💰', '💳', '💎', '⚖️', '🧰', '🪓', '🪚', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪛', '🔩', '⚙️', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🪦', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡️', '🧹', '🪠', '🧺', '🧻', '🚽', '🚿', '🛁', '🛀', '🧼', '🪥', '🪒', '🧴', '🧷', '🧹', '🪣', '🧽', '🪣', '🧯', '🛒', '🚬', '⚰️', '🪦', '⚱️', '🗿', '🪧', '🪪', '🏧', '🚮', '🚰', '♿', '🚹', '🚺', '🚻', '🚼', '🚾', '🛂', '🛃', '🛄', '🛅', '⚠️', '🚸', '⛔', '🚫', '🚳', '🚭', '🚯', '🚱', '🚷', '📵', '🔞', '☢️', '☣️'],
    'Symbols': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❓', '❕', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🔢', '🔟', '🔢', '🔠', '🔡', '🔤', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔠', '🔡', '🔤', '🆎', '🆑', '🆒', '🆓', '🆔', '🆕', '🆖', '🆗', '🆙', '🆚', '🈁', '🈂️', '🈷️', '🈶', '🈯', '🉐', '🈹', '🈲', '🉑', '🈸', '🈴', '🈳', '㊗️', '㊙️', '🈺', '🈵', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔶', '🔷', '🔸', '🔹', '🔺', '🔻', '💠', '🔘', '🔳', '🔲'],
  };

  // Comprehensive emoji search keywords mapping
  const emojiKeywords: Record<string, string[]> = {
    '😀': ['happy', 'smile', 'grinning', 'face', 'joy'],
    '😂': ['laugh', 'laughing', 'tears', 'joy', 'funny'],
    '😊': ['smile', 'happy', 'blush', 'pleased'],
    '😍': ['heart', 'eyes', 'love', 'adore', 'infatuated'],
    '🥰': ['smiling', 'hearts', 'love', 'adore'],
    '😎': ['cool', 'sunglasses', 'awesome'],
    '🤔': ['think', 'thinking', 'ponder'],
    '😭': ['cry', 'crying', 'sad', 'tears'],
    '😱': ['scream', 'shock', 'surprised'],
    '🤯': ['exploding', 'mind', 'blown'],
    '❤️': ['heart', 'love', 'red', 'like'],
    '🔥': ['fire', 'hot', 'flame', 'lit', 'trending'],
    '👍': ['thumbs', 'up', 'good', 'like', 'approve'],
    '🎉': ['party', 'celebration', 'congrats', 'tada'],
    '✨': ['sparkles', 'star', 'magic', 'shine'],
    '💯': ['100', 'hundred', 'perfect', 'score'],
    '🙌': ['hands', 'raise', 'praise', 'hooray'],
    '🐶': ['dog', 'puppy', 'pet', 'animal'],
    '🐱': ['cat', 'kitten', 'pet', 'animal'],
    '🐼': ['panda', 'bear', 'cute'],
    '🦁': ['lion', 'king', 'animal'],
    '🐯': ['tiger', 'stripes', 'animal'],
    '🍎': ['apple', 'fruit', 'red', 'food'],
    '🍕': ['pizza', 'food', 'slice'],
    '🍔': ['burger', 'hamburger', 'food'],
    '☕': ['coffee', 'drink', 'cafe'],
    '🍰': ['cake', 'birthday', 'sweet'],
    '🚗': ['car', 'vehicle', 'drive', 'auto'],
    '✈️': ['plane', 'airplane', 'travel', 'flight'],
    '🏠': ['house', 'home', 'building'],
    '🌍': ['earth', 'world', 'globe'],
    '⚽': ['soccer', 'football', 'sport', 'ball'],
    '🏀': ['basketball', 'sport', 'ball'],
    '🎮': ['game', 'gaming', 'controller'],
    '🎵': ['music', 'note', 'song'],
    '📱': ['phone', 'mobile', 'smartphone', 'device'],
    '💻': ['laptop', 'computer', 'tech'],
    '📷': ['camera', 'photo', 'picture'],
    '🎁': ['gift', 'present', 'box'],
  };

  // Get all emojis as a flat array for search
  const allEmojis = Object.values(emojiCategories).flat();

  // Filter emojis based on search
  const getFilteredEmojis = () => {
    if (!emojiSearch.trim()) {
      return emojiCategories;
    }

    const searchLower = emojiSearch.toLowerCase();
    const filtered: Record<string, string[]> = {};

    Object.entries(emojiCategories).forEach(([category, emojis]) => {
      const matchingEmojis = emojis.filter((emoji) => {
        if (category.toLowerCase().includes(searchLower)) return true;
        const keywords = emojiKeywords[emoji] || [];
        return keywords.some(keyword => keyword.includes(searchLower));
      });

      if (matchingEmojis.length > 0) {
        filtered[category] = matchingEmojis;
      }
    });

    return filtered;
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const textBefore = trendText.substring(0, start);
      const textAfter = trendText.substring(end);
      const newText = textBefore + emoji + textAfter;
      setTrendText(newText);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setTrendText(prev => prev + emoji);
    }
    setShowEmojiPicker(false);
    setEmojiSearch('');
  };

  const handleTrend = async () => {
    if (isPosting) return;
    
    // Validate that there's content
    if (!trendText.trim() && selectedMedia.length === 0 && !hasPoll) {
      alert('Please add some content to your post');
      return;
    }
    
    // Validate poll if it exists
    if (hasPoll) {
      const validPollOptions = pollOptions.filter(opt => opt.trim());
      if (validPollOptions.length < 2) {
        alert('Please add at least 2 poll options');
        return;
      }
    }
    
    setIsPosting(true);
    
    try {
      // Separate files from URLs (GIFs)
      const imageFiles: File[] = [];
      const videoFiles: File[] = [];
      const gifUrls: string[] = [];
      
      selectedMedia.forEach((media, index) => {
        if (media.startsWith('http') && !media.startsWith('data:')) {
          // This is a GIF URL
          gifUrls.push(media);
        } else if (index < selectedFiles.length) {
          // This is a file we uploaded
          const file = selectedFiles[index];
          if (file.type.startsWith('image/')) {
            imageFiles.push(file);
          } else if (file.type.startsWith('video/')) {
            videoFiles.push(file);
          }
        }
      });
      
      // Prepare request payload - use FormData if we have files, otherwise JSON
      const hasFiles = imageFiles.length > 0 || videoFiles.length > 0;
      
      let payload: FormData | any;
      
      if (hasFiles) {
        // Use FormData for file uploads
        payload = new FormData();
        payload.append('text', trendText.trim() || '');
        
        // Add image files
        imageFiles.forEach((file, index) => {
          payload.append(`images[${index}]`, file);
        });
        
        // Add video file (only one allowed)
        if (videoFiles.length > 0) {
          payload.append('video_file', videoFiles[0]);
        }
        
        // Add GIF URLs as JSON string (backend can parse)
        if (gifUrls.length > 0) {
          payload.append('gif_urls', JSON.stringify(gifUrls));
        }
      } else {
        // Use JSON for text-only posts or posts with only GIFs
        payload = {
          text: trendText.trim() || '',
        };
        
        // Add GIF URLs
        if (gifUrls.length > 0) {
          payload.images = gifUrls;
        }
      }
      
      // Add poll if present (works with both FormData and JSON)
      if (hasPoll && pollOptions.filter(opt => opt.trim()).length >= 2) {
        const pollQuestion = trendText.trim() || 'Poll';
        const pollOpts = pollOptions.filter(opt => opt.trim());
        
        if (hasFiles) {
          payload.append('poll_question', pollQuestion);
          payload.append('poll_options', JSON.stringify(pollOpts));
          payload.append('poll_duration', pollDuration);
        } else {
          payload.poll_question = pollQuestion;
          payload.poll_options = pollOpts;
          payload.poll_duration = pollDuration;
        }
      }
      
      // Add location if selected
      if (selectedLocation) {
        if (hasFiles) {
          payload.append('location', selectedLocation);
        } else {
          payload.location = selectedLocation;
        }
      }
      
      // Add scheduled time if set
      if (scheduledDate && scheduledTime) {
        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
        if (hasFiles) {
          payload.append('scheduled_at', scheduledDateTime);
        } else {
          payload.scheduled_at = scheduledDateTime;
        }
      }
      
      // console.log('📝 Composing trend:', {
      //   text: trendText.trim(),
      //   imageFilesCount: imageFiles.length,
      //   videoFilesCount: videoFiles.length,
      //   gifUrlsCount: gifUrls.length,
      //   hasPoll: !!hasPoll,
      //   hasLocation: !!selectedLocation,
      //   hasScheduled: !!(scheduledDate && scheduledTime),
      //   usingFormData: hasFiles,
      // });
      
      // Call API
      const response = await composeTrend(payload, hasFiles);
      
      if (response.error || response.status !== 200) {
        // console.error('❌ Error posting trend:', response.error);
        // console.error('Response status:', response.status);
        // console.error('Response data:', response.data);
        alert(response.error || 'Failed to post trend. Please try again.');
        setIsPosting(false);
        return;
      }
      
      // Check for success in response
      const isSuccess = response.status === 200 && (
        response.data?.success === true ||
        response.data?.message?.toLowerCase().includes('success') ||
        response.data?.data
      );
      
      if (!isSuccess) {
        // console.error('❌ Post failed:', response.data);
        alert(response.data?.message || 'Failed to post trend. Please try again.');
        setIsPosting(false);
        return;
      }
      
      // console.log('✅ Trend posted successfully!');
      
      // Set flag to refresh feed when navigating back
      sessionStorage.setItem('should_refresh_feed', 'true');
      sessionStorage.setItem('feed_was_refreshed', 'true');
      
      // Reset form
      setTrendText('');
      setSelectedMedia([]);
      setSelectedFiles([]);
      setShowEmojiPicker(false);
      setShowGifPicker(false);
      setShowPollCreator(false);
      setShowLocationPicker(false);
      setShowSchedulePicker(false);
      setPollOptions(['', '']);
      setPollDuration('1');
      setHasPoll(false);
      setSelectedLocation('');
      setLocationSearch('');
      setScheduledDate('');
      setScheduledTime('');
      
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
      
      // Navigate back to home with feed tab (refresh feed to show new post)
      router.push('/?tab=for-you');
    } catch (error) {
      // console.error('❌ Exception posting trend:', error);
      // console.error('Error details:', error instanceof Error ? error.message : String(error));
      alert('Failed to post trend. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  // Close modals when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      if (showGifPicker && gifPickerRef.current && !gifPickerRef.current.contains(target) && !target.closest('button[aria-label="Add GIF"]')) {
        setShowGifPicker(false);
      }
      if (showPollCreator && pollRef.current && !pollRef.current.contains(target) && !target.closest('button[aria-label="Create poll"]')) {
        setShowPollCreator(false);
      }
      if (showLocationPicker && locationRef.current && !locationRef.current.contains(target) && !target.closest('button[aria-label="Add location"]')) {
        setShowLocationPicker(false);
        setLocationSearch('');
      }
      if (showSchedulePicker && scheduleRef.current && !scheduleRef.current.contains(target) && !target.closest('button[aria-label="Schedule post"]')) {
        setShowSchedulePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showGifPicker, showPollCreator, showLocationPicker, showSchedulePicker]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('button[aria-label="Add emoji"]')
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  useEffect(() => {
    // Focus textarea on mount
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  return (
    <main className="border-x border-border bg-background min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border px-4 lg:px-6 py-4 z-10 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-manipulation"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
        <button
          onClick={handleTrend}
          disabled={(!trendText.trim() && selectedMedia.length === 0 && !(hasPoll && pollOptions.filter(opt => opt.trim()).length >= 2) && !selectedLocation && !scheduledDate) || isPosting}
          className="bg-black dark:bg-white text-white dark:text-black font-bold py-2.5 px-6 sm:px-8 rounded-full hover:opacity-90 active:opacity-75 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none text-sm sm:text-base min-h-[44px] flex items-center justify-center"
        >
          {isPosting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin"></span>
              <span>Posting...</span>
            </span>
          ) : scheduledDate && scheduledTime ? (
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Schedule</span>
            </span>
          ) : (
            'Trend'
          )}
        </button>
      </div>

      {/* Compose Form */}
      <div className="px-4 lg:px-6 py-6">
        <div className="flex space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
              Y
            </div>
          </div>
          <div className="flex-1 min-w-0 relative overflow-visible">
            <textarea
              ref={textareaRef}
              placeholder="What's happening?"
              value={trendText}
              onChange={(e) => setTrendText(e.target.value)}
              className="w-full resize-none border-none outline-none text-xl placeholder-muted-foreground min-h-[200px] focus:outline-none bg-background text-foreground"
            />
            
            {/* Media Preview */}
            {selectedMedia.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl overflow-hidden">
                {selectedMedia.map((media, index) => (
                  <div key={index} className="relative group">
                    {media.startsWith('data:image/') || media.startsWith('http') ? (
                      <img
                        src={media}
                        alt={`Media ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <video
                        src={media}
                        className="w-full h-48 object-cover rounded-lg"
                        controls
                      />
                    )}
                    <button
                      onClick={() => removeMedia(index)}
                      className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove media"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Poll Preview */}
            {hasPoll && pollOptions.filter(opt => opt.trim()).length >= 2 && (
              <div className="mt-4 p-4 border border-border rounded-xl bg-muted/30 relative group">
                <button
                  onClick={() => {
                    setHasPoll(false);
                    setShowPollCreator(false);
                    setPollOptions(['', '']);
                    setPollDuration('1');
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  aria-label="Remove poll"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  <h4 className="font-semibold text-foreground">Poll</h4>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {pollDuration} {pollDuration === '1' ? 'day' : 'days'}
                  </span>
                </div>
                <div className="space-y-2">
                  {pollOptions.filter(opt => opt.trim()).map((option, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                    >
                      {option || `Option ${index + 1}`}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4 relative overflow-visible">
              <div className="flex items-center flex-wrap gap-1 sm:gap-2 relative overflow-visible">
                {/* Image Upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="p-2.5 rounded-full hover:bg-blue-500/10 active:bg-blue-500/20 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-all duration-200 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center group"
                  aria-label="Upload image"
                  title="Add photos"
                >
                  <ImageIcon className="w-5 h-5 group-active:scale-110 transition-transform" />
                </label>

                {/* Video Upload */}
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                  id="video-upload"
                />
                <label
                  htmlFor="video-upload"
                  className="p-2.5 rounded-full hover:bg-blue-500/10 active:bg-blue-500/20 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-all duration-200 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center group"
                  aria-label="Upload video"
                  title="Add video"
                >
                  <Video className="w-5 h-5 group-active:scale-110 transition-transform" />
                </label>

                {/* GIF Picker */}
                <div className="relative">
                  <button
                    onClick={() => setShowGifPicker(!showGifPicker)}
                    className={`p-2.5 rounded-full hover:bg-blue-500/10 active:bg-blue-500/20 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center group font-bold text-xs ${
                      showGifPicker ? 'bg-blue-500/20' : ''
                    }`}
                    aria-label="Add GIF"
                    title="Add GIF"
                  >
                    <span className="group-active:scale-110 transition-transform">GIF</span>
                  </button>

                  {/* GIF Picker Popover */}
                  {showGifPicker && (
                    <>
                      {/* Mobile Backdrop */}
                      <div 
                        className="fixed inset-0 bg-black/50 z-40 sm:hidden"
                        onClick={() => setShowGifPicker(false)}
                      />
                      <div
                        ref={gifPickerRef}
                        className="fixed sm:absolute bottom-0 sm:bottom-auto sm:top-full left-0 sm:left-0 right-0 sm:right-auto sm:mt-2 mx-4 sm:mx-0 sm:w-[320px] md:w-[400px] sm:max-w-[400px] bg-background border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl z-50 max-h-[70vh] sm:max-h-[400px] overflow-hidden flex flex-col"
                      >
                        <div className="p-3 border-b border-border flex items-center justify-between">
                          <h3 className="font-semibold text-foreground">GIFs</h3>
                          <button
                            onClick={() => setShowGifPicker(false)}
                            className="p-1 rounded-full hover:bg-accent transition-colors"
                            aria-label="Close GIF picker"
                          >
                            <X className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                        <div className="overflow-y-auto p-3 grid grid-cols-2 gap-2">
                          {popularGifs.map((gif) => (
                            <button
                              key={gif.id}
                              onClick={() => handleGifSelect(gif.url)}
                              className="relative group rounded-lg overflow-hidden hover:ring-2 ring-blue-500 transition-all"
                              aria-label={`Select ${gif.title} GIF`}
                            >
                              <img src={gif.url} alt={gif.title} className="w-full h-32 object-cover" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Emoji Picker */}
                <div className="relative hidden sm:block">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`p-2.5 rounded-full hover:bg-blue-500/10 active:bg-blue-500/20 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center group ${
                      showEmojiPicker ? 'bg-blue-500/20' : ''
                    }`}
                    aria-label="Add emoji"
                    title="Add emoji"
                  >
                    <Smile className={`w-5 h-5 group-active:scale-110 transition-transform ${showEmojiPicker ? 'scale-110' : ''}`} />
                  </button>

                  {/* Emoji Picker Popover */}
                  {showEmojiPicker && (
                    <>
                      {/* Mobile Backdrop */}
                      <div 
                        className="fixed inset-0 bg-black/50 z-40 sm:hidden"
                        onClick={() => setShowEmojiPicker(false)}
                      />
                      <div
                        ref={emojiPickerRef}
                        className="fixed sm:absolute bottom-0 sm:bottom-auto sm:top-full left-0 sm:left-0 right-0 sm:right-auto sm:mt-2 mx-4 sm:mx-0 sm:w-[320px] md:w-[380px] sm:max-w-[380px] bg-background border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl z-50 max-h-[70vh] sm:max-h-[450px] overflow-hidden flex flex-col"
                      >
                        {/* Header with Search */}
                        <div className="p-3 border-b border-border">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-foreground">Emoji</h3>
                            <button
                              onClick={() => {
                                setShowEmojiPicker(false);
                                setEmojiSearch('');
                              }}
                              className="p-1 rounded-full hover:bg-accent transition-colors"
                              aria-label="Close emoji picker"
                            >
                              <X className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </div>
                          {/* Search Input */}
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              type="text"
                              placeholder="Search emojis..."
                              value={emojiSearch}
                              onChange={(e) => setEmojiSearch(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                              autoFocus
                            />
                          </div>
                        </div>

                        {/* Emoji Grid */}
                        <div className="overflow-y-auto p-3 flex-1">
                          {Object.entries(getFilteredEmojis()).length > 0 ? (
                            Object.entries(getFilteredEmojis()).map(([category, emojis]) => (
                              <div key={category} className="mb-4">
                                <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide px-1">
                                  {category}
                                </h4>
                                <div className="grid grid-cols-8 gap-1">
                                  {emojis.map((emoji, index) => (
                                    <button
                                      key={`${category}-${index}`}
                                      onClick={() => insertEmoji(emoji)}
                                      className="p-2 text-2xl hover:bg-accent rounded-lg transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                                      aria-label={`Insert ${emoji} emoji`}
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <p className="text-sm">No emojis found</p>
                              <p className="text-xs mt-1">Try a different search term</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Poll Creator */}
                <div className="relative">
                  <button
                    onClick={() => setShowPollCreator(!showPollCreator)}
                    className={`p-2.5 rounded-full hover:bg-blue-500/10 active:bg-blue-500/20 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center group ${
                      showPollCreator ? 'bg-blue-500/20' : ''
                    }`}
                    aria-label="Create poll"
                    title="Create poll"
                  >
                    <BarChart3 className="w-5 h-5 group-active:scale-110 transition-transform" />
                  </button>

                  {/* Poll Creator Popover */}
                  {showPollCreator && (
                    <>
                      {/* Mobile Backdrop */}
                      <div 
                        className="fixed inset-0 bg-black/50 z-40 sm:hidden"
                        onClick={() => setShowPollCreator(false)}
                      />
                      <div
                        ref={pollRef}
                        className="fixed sm:absolute bottom-0 sm:bottom-auto sm:top-full left-0 sm:left-0 right-0 sm:right-auto sm:mt-2 mx-4 sm:mx-0 sm:w-[320px] md:w-[400px] sm:max-w-[400px] bg-background border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl z-50 p-4 max-h-[80vh] sm:max-h-none overflow-y-auto"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-foreground">Create Poll</h3>
                          <button
                            onClick={() => setShowPollCreator(false)}
                            className="p-1 rounded-full hover:bg-accent transition-colors"
                            aria-label="Close poll creator"
                          >
                            <X className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                        <div className="space-y-3">
                          {pollOptions.map((option, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder={`Option ${index + 1}`}
                                value={option}
                                onChange={(e) => updatePollOption(index, e.target.value)}
                                className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              {pollOptions.length > 2 && (
                                <button
                                  onClick={() => removePollOption(index)}
                                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                  aria-label="Remove option"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          {pollOptions.length < 4 && (
                            <button
                              onClick={addPollOption}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-border rounded-lg text-blue-500 hover:bg-blue-500/10 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                              <span className="text-sm">Add option</span>
                            </button>
                          )}
                          <div className="pt-2">
                            <label className="block text-sm font-medium text-foreground mb-2">Poll duration</label>
                            <select
                              value={pollDuration}
                              onChange={(e) => setPollDuration(e.target.value)}
                              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="1">1 day</option>
                              <option value="3">3 days</option>
                              <option value="7">7 days</option>
                            </select>
                          </div>
                          {pollOptions.filter(opt => opt.trim()).length >= 2 && (
                            <button
                              onClick={() => {
                                setHasPoll(true);
                                setShowPollCreator(false);
                              }}
                              className="w-full mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm"
                            >
                              Add Poll
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Location Picker */}
                <div className="relative">
                  <button
                    onClick={() => setShowLocationPicker(!showLocationPicker)}
                    className={`p-2.5 rounded-full hover:bg-blue-500/10 active:bg-blue-500/20 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center group ${
                      selectedLocation ? 'bg-blue-500/20' : ''
                    }`}
                    aria-label="Add location"
                    title="Add location"
                  >
                    <MapPin className={`w-5 h-5 group-active:scale-110 transition-transform ${selectedLocation ? 'fill-current' : ''}`} />
                  </button>

                  {/* Location Picker Popover */}
                  {showLocationPicker && (
                    <>
                      {/* Mobile Backdrop */}
                      <div 
                        className="fixed inset-0 bg-black/50 z-40 sm:hidden"
                        onClick={() => {
                          setShowLocationPicker(false);
                          setLocationSearch('');
                        }}
                      />
                      <div
                        ref={locationRef}
                        className="fixed sm:absolute bottom-0 sm:bottom-auto sm:top-full left-0 sm:left-0 right-0 sm:right-auto sm:mt-2 mx-4 sm:mx-0 w-[calc(100vw-2rem)] sm:w-[320px] md:w-[400px] max-w-[400px] bg-background border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl z-50 max-h-[70vh] sm:max-h-[400px] overflow-hidden flex flex-col"
                      >
                        <div className="p-3 border-b border-border flex items-center justify-between">
                          <h3 className="font-semibold text-foreground">Add Location</h3>
                          <button
                            onClick={() => {
                              setShowLocationPicker(false);
                              setLocationSearch('');
                            }}
                            className="p-1 rounded-full hover:bg-accent transition-colors"
                            aria-label="Close location picker"
                          >
                            <X className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                        {/* Search Input */}
                        <div className="p-3 border-b border-border">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              type="text"
                              placeholder="Search for a location..."
                              value={locationSearch}
                              onChange={(e) => setLocationSearch(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="overflow-y-auto p-2 flex-1">
                          {filteredLocations.length > 0 ? (
                            <div className="space-y-1">
                              {filteredLocations.map((location) => (
                                <button
                                  key={location}
                                  onClick={() => {
                                    setSelectedLocation(location);
                                    setShowLocationPicker(false);
                                    setLocationSearch('');
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-lg hover:bg-accent transition-colors ${
                                    selectedLocation === location ? 'bg-blue-500/10 text-blue-500' : 'text-foreground'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 flex-shrink-0" />
                                    <span className="text-sm">{location}</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No locations found</p>
                              <p className="text-xs mt-1">Try a different search term</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Schedule Picker */}
                <div className="relative">
                  <button
                    onClick={() => setShowSchedulePicker(!showSchedulePicker)}
                    className={`p-2.5 rounded-full hover:bg-blue-500/10 active:bg-blue-500/20 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center group ${
                      scheduledDate && scheduledTime ? 'bg-blue-500/20' : ''
                    }`}
                    aria-label="Schedule post"
                    title="Schedule post"
                  >
                    <Calendar className={`w-5 h-5 group-active:scale-110 transition-transform ${scheduledDate && scheduledTime ? 'fill-current' : ''}`} />
                  </button>

                  {/* Schedule Picker Popover */}
                  {showSchedulePicker && (
                    <>
                      {/* Mobile Backdrop */}
                      <div 
                        className="fixed inset-0 bg-black/50 z-40 sm:hidden"
                        onClick={() => setShowSchedulePicker(false)}
                      />
                      <div
                        ref={scheduleRef}
                        className="fixed sm:absolute bottom-0 sm:bottom-auto sm:top-full left-0 sm:left-0 right-0 sm:right-auto sm:mt-2 mx-4 sm:mx-0 sm:w-[320px] md:w-[400px] sm:max-w-[400px] bg-background border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl z-50 p-4 max-h-[70vh] sm:max-h-none overflow-y-auto"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-foreground">Schedule Post</h3>
                          <button
                            onClick={() => {
                              setShowSchedulePicker(false);
                              setScheduledDate('');
                              setScheduledTime('');
                            }}
                            className="p-1 rounded-full hover:bg-accent transition-colors"
                            aria-label="Close schedule picker"
                          >
                            <X className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Date</label>
                            <input
                              type="date"
                              value={scheduledDate}
                              onChange={(e) => setScheduledDate(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Time</label>
                            <input
                              type="time"
                              value={scheduledTime}
                              onChange={(e) => setScheduledTime(e.target.value)}
                              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          {scheduledDate && scheduledTime && (
                            <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-lg text-sm text-blue-500">
                              <Clock className="w-4 h-4" />
                              <span>Scheduled for {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
