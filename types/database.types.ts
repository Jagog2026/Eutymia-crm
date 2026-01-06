export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          block_reason: string | null
          branch: string | null
          created_at: string | null
          date: string
          end_time: string | null
          estimated_value: number | null
          id: string
          notes: string | null
          patient_email: string | null
          patient_name: string
          patient_phone: string | null
          payment_date: string | null
          payment_method: string | null
          payment_proof_url: string | null
          payment_status: string | null
          price: number | null
          service: string
          status: string | null
          therapist_id: string
          time: string
          updated_at: string | null
        }
        Insert: {
          block_reason?: string | null
          branch?: string | null
          created_at?: string | null
          date: string
          end_time?: string | null
          estimated_value?: number | null
          id?: string
          notes?: string | null
          patient_email?: string | null
          patient_name: string
          patient_phone?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_proof_url?: string | null
          payment_status?: string | null
          price?: number | null
          service: string
          status?: string | null
          therapist_id: string
          time: string
          updated_at?: string | null
        }
        Update: {
          block_reason?: string | null
          branch?: string | null
          created_at?: string | null
          date?: string
          end_time?: string | null
          estimated_value?: number | null
          id?: string
          notes?: string | null
          patient_email?: string | null
          patient_name?: string
          patient_phone?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_proof_url?: string | null
          payment_status?: string | null
          price?: number | null
          service?: string
          status?: string | null
          therapist_id?: string
          time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapists"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          description: string
          due_date: string
          id: string
          notes: string | null
          paid_date: string | null
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          description: string
          due_date: string
          id?: string
          notes?: string | null
          paid_date?: string | null
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          description?: string
          due_date?: string
          id?: string
          notes?: string | null
          paid_date?: string | null
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      lead_tasks: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          lead_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          age: number | null
          assigned_therapist_id: string | null
          birth_date: string | null
          city: string | null
          client_number: string | null
          comuna: string | null
          created_at: string | null
          dni: string | null
          email: string | null
          facebook_account: string | null
          full_name: string
          gender: string | null
          id: string
          name: string | null
          notes: string | null
          phone: string | null
          secondary_phone: string | null
          service: string | null
          service_interest: string | null
          source: string | null
          status: string | null
          updated_at: string | null
          value: number | null
          whatsapp_line: string | null
        }
        Insert: {
          address?: string | null
          age?: number | null
          assigned_therapist_id?: string | null
          birth_date?: string | null
          city?: string | null
          client_number?: string | null
          comuna?: string | null
          created_at?: string | null
          dni?: string | null
          email?: string | null
          facebook_account?: string | null
          full_name: string
          gender?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          secondary_phone?: string | null
          service?: string | null
          service_interest?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          value?: number | null
          whatsapp_line?: string | null
        }
        Update: {
          address?: string | null
          age?: number | null
          assigned_therapist_id?: string | null
          birth_date?: string | null
          city?: string | null
          client_number?: string | null
          comuna?: string | null
          created_at?: string | null
          dni?: string | null
          email?: string | null
          facebook_account?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          secondary_phone?: string | null
          service?: string | null
          service_interest?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          value?: number | null
          whatsapp_line?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_therapist_id_fkey"
            columns: ["assigned_therapist_id"]
            isOneToOne: false
            referencedRelation: "therapists"
            referencedColumns: ["id"]
          },
        ]
      }
      therapists: {
        Row: {
          active: boolean | null
          color: string | null
          commission_percentage: number | null
          commissions: Json | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          photo_url: string | null
          role: string | null
          schedule: Json | null
          services: string[] | null
          specialty: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          color?: string | null
          commission_percentage?: number | null
          commissions?: Json | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          photo_url?: string | null
          role?: string | null
          schedule?: Json | null
          services?: string[] | null
          specialty?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          color?: string | null
          commission_percentage?: number | null
          commissions?: Json | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          photo_url?: string | null
          role?: string | null
          schedule?: Json | null
          services?: string[] | null
          specialty?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          active: boolean | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          password: string
          role: string | null
          therapist_id: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          password: string
          role?: string | null
          therapist_id?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          password?: string
          role?: string | null
          therapist_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapists"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_registrations: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string
          payment_amount: number | null
          payment_status: string | null
          status: string | null
          updated_at: string | null
          workshop_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id: string
          payment_amount?: number | null
          payment_status?: string | null
          status?: string | null
          updated_at?: string | null
          workshop_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string
          payment_amount?: number | null
          payment_status?: string | null
          status?: string | null
          updated_at?: string | null
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_registrations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_registrations_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshops: {
        Row: {
          attendees: number | null
          created_at: string | null
          current_attendees: number | null
          date: string
          description: string | null
          duration_minutes: number | null
          id: string
          image_url: string | null
          max_attendees: number | null
          modality: string | null
          price: number | null
          therapist_id: string | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          attendees?: number | null
          created_at?: string | null
          current_attendees?: number | null
          date: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          max_attendees?: number | null
          modality?: string | null
          price?: number | null
          therapist_id?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          attendees?: number | null
          created_at?: string | null
          current_attendees?: number | null
          date?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          max_attendees?: number | null
          modality?: string | null
          price?: number | null
          therapist_id?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workshops_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapists"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
