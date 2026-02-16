#!/usr/bin/env python3
"""
Cross-Platform Tutor Matcher & Contact Enricher

Matches tutors across platforms by name + country, extracts contact info
from bios, and identifies high-value prospects with the best data.

Input:  scraped-data/italki-english-teachers.json
        scraped-data/preply-profiles.jsonl
        scraped-data/youtube-enriched.jsonl
        
Output: scraped-data/ENRICHED_PROSPECTS.json
        scraped-data/CONTACT_READY.json (tutors with verified contact info)
"""

import json
import re
import os
from collections import defaultdict

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'scraped-data')

def load_json(filename):
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        return []
    with open(path) as f:
        return json.load(f)

def load_jsonl(filename):
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        return []
    results = []
    with open(path) as f:
        for line in f:
            if line.strip():
                try:
                    results.append(json.loads(line))
                except json.JSONDecodeError:
                    pass
    return results

def extract_contact_info(text):
    """Extract emails, URLs, social handles from text."""
    if not text:
        return {}
    
    info = {}
    
    # Emails
    emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
    if emails:
        info['emails'] = list(set(emails))
    
    # URLs (excluding platform URLs)
    urls = re.findall(r'https?://[^\s<>"\']+', text)
    external_urls = [u for u in urls if not any(p in u.lower() for p in ['italki.com', 'preply.com', 'verbling.com'])]
    if external_urls:
        info['websites'] = external_urls
    
    # Instagram
    ig = re.findall(r'(?:instagram\.com/|ig:|insta(?:gram)?[:\s]*@?)([a-zA-Z0-9_.]+)', text, re.I)
    if ig:
        info['instagram'] = list(set(ig))
    
    # LinkedIn
    li = re.findall(r'linkedin\.com/in/([a-zA-Z0-9_-]+)', text, re.I)
    if li:
        info['linkedin'] = list(set(li))
    
    # Facebook
    fb = re.findall(r'facebook\.com/([a-zA-Z0-9_.]+)', text, re.I)
    if fb:
        info['facebook'] = list(set(fb))
    
    # Twitter/X
    tw = re.findall(r'(?:twitter\.com|x\.com)/([a-zA-Z0-9_]+)', text, re.I)
    if tw:
        info['twitter'] = list(set(tw))
    
    # TikTok
    tt = re.findall(r'tiktok\.com/@([a-zA-Z0-9_.]+)', text, re.I)
    if tt:
        info['tiktok'] = list(set(tt))
    
    # Personal website domains (look for common patterns)
    domains = re.findall(r'(?:my\s*(?:website|site|page)|visit|check\s*out)[:\s]*(?:https?://)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', text, re.I)
    if domains:
        info['mentioned_domains'] = list(set(domains))
    
    return info

def normalise_name(name):
    """Normalise name for matching."""
    if not name:
        return ''
    # Remove emojis, special chars, keep letters and spaces
    clean = re.sub(r'[^\w\s]', '', name).strip().lower()
    # Remove common suffixes
    clean = re.sub(r'\s+(tutor|teacher|prof|dr|mr|mrs|ms)\.?$', '', clean, flags=re.I)
    return clean

def match_score(t1, t2):
    """Score how likely two records are the same person."""
    score = 0
    
    n1 = normalise_name(t1.get('name', ''))
    n2 = normalise_name(t2.get('name', ''))
    
    if n1 and n2:
        # Exact name match
        if n1 == n2:
            score += 50
        # First name match
        elif n1.split()[0] == n2.split()[0]:
            score += 25
    
    # Country match
    c1 = (t1.get('country') or '').upper()[:2]
    c2 = (t2.get('country') or '').upper()[:2]
    if c1 and c2 and c1 == c2:
        score += 20
    
    return score

def main():
    print("🔗 Cross-Platform Tutor Matcher & Enricher\n")
    
    # Load all data
    italki_raw = load_json('italki-english-teachers.json')
    preply_profiles = load_jsonl('preply-profiles.jsonl')
    youtube_enriched = load_jsonl('youtube-enriched.jsonl')
    
    # Deduplicate iTalki
    seen_ids = set()
    italki = []
    for t in italki_raw:
        if t['user_id'] not in seen_ids:
            seen_ids.add(t['user_id'])
            italki.append(t)
    
    print(f"  iTalki unique: {len(italki)}")
    print(f"  Preply profiles: {len(preply_profiles)}")
    print(f"  YouTube enriched: {len(youtube_enriched)}")
    
    # Build YouTube lookup (video_id → channel info)
    yt_lookup = {}
    for yt in youtube_enriched:
        if yt.get('resolved'):
            yt_lookup[yt['video_id']] = yt
    
    # Enrich each tutor
    all_prospects = []
    
    # Process iTalki tutors
    for t in italki:
        prospect = {
            'name': t['nickname'],
            'country': t.get('origin_country'),
            'city': t.get('living_city'),
            'platform': 'italki',
            'platform_id': str(t['user_id']),
            'profile_url': t.get('profile_url', f"https://www.italki.com/en/teacher/{t['user_id']}"),
            'rating': float(t.get('overall_rating') or 0),
            'sessions': t.get('session_count', 0),
            'students': t.get('student_count', 0),
            'is_pro': bool(t.get('is_pro')),
            'bio': t.get('about_me', ''),
            'headline': t.get('short_signature', ''),
        }
        
        # Extract contact info from bio + teaching style
        full_text = ' '.join(filter(None, [t.get('about_me'), t.get('teaching_style'), t.get('short_signature')]))
        contact = extract_contact_info(full_text)
        prospect['contact'] = contact
        
        # YouTube enrichment
        video_url = t.get('youtube_video') or t.get('video_url') or ''
        vid_match = re.search(r'youtube\.com/embed/([a-zA-Z0-9_-]+)', video_url)
        if vid_match:
            vid_id = vid_match.group(1)
            if vid_id in yt_lookup:
                yt_info = yt_lookup[vid_id]
                # Only count as personal if not a platform-hosted video
                if not any(p in (yt_info.get('channel_name') or '').lower() for p in ['italki', 'preply']):
                    prospect['youtube_channel'] = yt_info.get('channel_name')
                    prospect['youtube_channel_url'] = yt_info.get('channel_url')
                    contact['youtube'] = yt_info.get('channel_url')
        
        # Score contactability
        contact_score = 0
        if contact.get('emails'): contact_score += 40
        if contact.get('websites'): contact_score += 20
        if contact.get('instagram'): contact_score += 15
        if contact.get('linkedin'): contact_score += 25
        if contact.get('youtube'): contact_score += 15
        if contact.get('twitter'): contact_score += 10
        if contact.get('tiktok'): contact_score += 10
        prospect['contact_score'] = min(contact_score, 100)
        
        # Prospect value score
        value_score = 0
        if prospect['sessions'] >= 5000: value_score += 30
        elif prospect['sessions'] >= 1000: value_score += 20
        elif prospect['sessions'] >= 100: value_score += 10
        if prospect['rating'] >= 4.9: value_score += 15
        if prospect['students'] >= 100: value_score += 15
        if prospect['is_pro']: value_score += 10
        if len(prospect['bio']) > 200: value_score += 5
        prospect['value_score'] = value_score
        
        # Combined score
        prospect['total_score'] = prospect['contact_score'] + prospect['value_score']
        
        all_prospects.append(prospect)
    
    # Process Preply profiles
    for p in preply_profiles:
        prospect = {
            'name': p.get('name'),
            'country': p.get('country'),
            'city': None,
            'platform': 'preply',
            'platform_id': str(p.get('id')),
            'profile_url': f"https://preply.com/en/tutor/{p.get('id')}",
            'rating': p.get('rating'),
            'sessions': p.get('lessons', 0),
            'students': None,
            'is_pro': None,
            'bio': p.get('bio', ''),
            'headline': p.get('headline', ''),
        }
        
        # Extract contact info
        full_text = p.get('bio', '')
        contact = extract_contact_info(full_text)
        
        # YouTube from Preply profile
        if p.get('youtube_url'):
            contact['youtube'] = p['youtube_url']
            vid_match = re.search(r'v=([a-zA-Z0-9_-]+)', p['youtube_url'])
            if vid_match and vid_match.group(1) in yt_lookup:
                yt_info = yt_lookup[vid_match.group(1)]
                if not any(pl in (yt_info.get('channel_name') or '').lower() for pl in ['italki', 'preply']):
                    prospect['youtube_channel'] = yt_info.get('channel_name')
                    prospect['youtube_channel_url'] = yt_info.get('channel_url')
        
        prospect['contact'] = contact
        
        # Score contactability
        contact_score = 0
        if contact.get('emails'): contact_score += 40
        if contact.get('websites'): contact_score += 20
        if contact.get('instagram'): contact_score += 15
        if contact.get('linkedin'): contact_score += 25
        if contact.get('youtube'): contact_score += 15
        if contact.get('twitter'): contact_score += 10
        prospect['contact_score'] = min(contact_score, 100)
        
        # Value score
        value_score = 0
        if prospect['sessions'] >= 5000: value_score += 30
        elif prospect['sessions'] >= 1000: value_score += 20
        elif prospect['sessions'] >= 100: value_score += 10
        if (prospect['rating'] or 0) >= 4.9: value_score += 15
        if len(prospect['bio']) > 200: value_score += 5
        prospect['value_score'] = value_score
        
        prospect['total_score'] = prospect['contact_score'] + prospect['value_score']
        
        all_prospects.append(prospect)
    
    # Sort by total score
    all_prospects.sort(key=lambda x: x['total_score'], reverse=True)
    
    # Save all enriched prospects
    output_path = os.path.join(DATA_DIR, 'ENRICHED_PROSPECTS.json')
    with open(output_path, 'w') as f:
        json.dump(all_prospects, f, indent=2)
    
    # Filter contact-ready (any contact method found)
    contact_ready = [p for p in all_prospects if p['contact_score'] > 0]
    cr_path = os.path.join(DATA_DIR, 'CONTACT_READY.json')
    with open(cr_path, 'w') as f:
        json.dump(contact_ready, f, indent=2)
    
    # Stats
    print(f"\n{'='*50}")
    print(f"📊 ENRICHMENT RESULTS")
    print(f"{'='*50}")
    print(f"Total prospects: {len(all_prospects)}")
    print(f"With ANY contact info: {len(contact_ready)} ({len(contact_ready)/len(all_prospects)*100:.0f}%)")
    
    has_email = sum(1 for p in all_prospects if p['contact'].get('emails'))
    has_website = sum(1 for p in all_prospects if p['contact'].get('websites'))
    has_insta = sum(1 for p in all_prospects if p['contact'].get('instagram'))
    has_linkedin = sum(1 for p in all_prospects if p['contact'].get('linkedin'))
    has_youtube = sum(1 for p in all_prospects if p.get('youtube_channel'))
    has_twitter = sum(1 for p in all_prospects if p['contact'].get('twitter'))
    
    print(f"\nContact methods found:")
    print(f"  Email:    {has_email}")
    print(f"  Website:  {has_website}")
    print(f"  Instagram:{has_insta}")
    print(f"  LinkedIn: {has_linkedin}")
    print(f"  YouTube:  {has_youtube} (personal channels)")
    print(f"  Twitter:  {has_twitter}")
    
    # Show top prospects
    print(f"\n🏆 TOP 15 PROSPECTS (by combined score):")
    for p in all_prospects[:15]:
        contacts = []
        if p['contact'].get('emails'): contacts.append(f"✉️ {p['contact']['emails'][0]}")
        if p['contact'].get('websites'): contacts.append(f"🌐 {p['contact']['websites'][0][:40]}")
        if p['contact'].get('instagram'): contacts.append(f"📸 @{p['contact']['instagram'][0]}")
        if p['contact'].get('linkedin'): contacts.append(f"💼 {p['contact']['linkedin'][0]}")
        if p.get('youtube_channel'): contacts.append(f"🎬 {p['youtube_channel']}")
        
        contact_str = ' | '.join(contacts) if contacts else '(no contact yet)'
        print(f"  [{p['total_score']:3d}] {p['name']} ({p['country']}) — {p['sessions']} sessions")
        print(f"        {p['platform']} | {contact_str}")
    
    print(f"\nFiles:")
    print(f"  {output_path}")
    print(f"  {cr_path}")

if __name__ == '__main__':
    main()
