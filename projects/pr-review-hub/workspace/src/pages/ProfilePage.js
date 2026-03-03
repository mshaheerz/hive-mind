// File: src/pages/ProfilePage.js
export async function getServerSideProps({ params }) {
  const profileData = await fetch(`/api/profile/${params.id}`);
  return { props: { data: profileData.json() } };
}

function ProfilePage({ data }) {
  useEffect(() => {...}, [data]);
}
